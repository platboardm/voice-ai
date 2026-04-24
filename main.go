package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/voice-ai/internal/config"
	"github.com/voice-ai/internal/server"
)

func main() {
	// Load configuration from environment and config files
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("failed to load configuration: %v", err)
	}

	// Set up a root context that cancels on OS interrupt signals
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	quit := make(chan os.Signal, 1)
	// Also handle SIGHUP so I can reload config without a full restart
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM, syscall.SIGHUP)
	go func() {
		sig := <-quit
		log.Printf("received signal %s, shutting down...", sig)
		cancel()
	}()

	// Initialise and start the HTTP/WebSocket server
	srv, err := server.New(cfg)
	if err != nil {
		log.Fatalf("failed to create server: %v", err)
	}

	addr := fmt.Sprintf("%s:%d", cfg.Host, cfg.Port)
	log.Printf("voice-ai server starting on %s", addr)

	if err := srv.Run(ctx, addr); err != nil {
		log.Fatalf("server exited with error: %v", err)
	}

	log.Println("server stopped gracefully")
}
