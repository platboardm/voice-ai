package internal_service

import (
	"context"

	internal_entity "github.com/rapidaai/api/web-api/internal/entity"
	"github.com/rapidaai/pkg/types"
)

type BillingService interface {
	GetAllPlans(ctx context.Context) ([]*internal_entity.BillingPlan, error)
	GetSubscription(ctx context.Context, orgId uint64) (*internal_entity.BillingSubscription, error)
	UpdateSubscription(ctx context.Context, auth types.Principle, orgId uint64, planSlug string) (*internal_entity.BillingSubscription, error)
	ProvisionDefaultPlan(ctx context.Context, auth types.Principle, orgId uint64) (*internal_entity.BillingSubscription, error)
}
