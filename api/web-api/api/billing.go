package web_api

import (
	"context"
	"errors"

	config "github.com/rapidaai/api/web-api/config"
	internal_service "github.com/rapidaai/api/web-api/internal/service"
	internal_billing_service "github.com/rapidaai/api/web-api/internal/service/billing"
	commons "github.com/rapidaai/pkg/commons"
	"github.com/rapidaai/pkg/connectors"
	"github.com/rapidaai/pkg/types"
	"github.com/rapidaai/pkg/utils"
	protos "github.com/rapidaai/protos"
)

type webBillingApi struct {
	cfg            *config.WebAppConfig
	logger         commons.Logger
	postgres       connectors.PostgresConnector
	billingService internal_service.BillingService
}

type webBillingGRPCApi struct {
	webBillingApi
}

func NewBillingGRPC(config *config.WebAppConfig, logger commons.Logger,
	postgres connectors.PostgresConnector) protos.BillingServiceServer {
	return &webBillingGRPCApi{
		webBillingApi: webBillingApi{
			cfg:            config,
			logger:         logger,
			postgres:       postgres,
			billingService: internal_billing_service.NewBillingService(logger, postgres),
		},
	}
}

func (bG *webBillingGRPCApi) GetAllPlans(c context.Context, req *protos.GetAllPlansRequest) (*protos.GetAllPlansResponse, error) {
	_, isAuthenticated := types.GetAuthPrincipleGPRC(c)
	if !isAuthenticated {
		return nil, errors.New("unauthenticated request")
	}

	plans, err := bG.billingService.GetAllPlans(c)
	if err != nil {
		bG.logger.Errorf("GetAllPlans error: %v", err)
		return &protos.GetAllPlansResponse{
			Code:    400,
			Success: false,
			Error: &protos.Error{
				ErrorCode:    400,
				ErrorMessage: err.Error(),
				HumanMessage: "Unable to fetch billing plans.",
			},
		}, nil
	}

	var protoPlans []*protos.BillingPlan
	if castErr := utils.Cast(plans, &protoPlans); castErr != nil {
		bG.logger.Errorf("unable to cast billing plans: %v", castErr)
	}

	return &protos.GetAllPlansResponse{
		Code:    200,
		Success: true,
		Data:    protoPlans,
	}, nil
}

func (bG *webBillingGRPCApi) GetSubscription(c context.Context, req *protos.GetSubscriptionRequest) (*protos.GetSubscriptionResponse, error) {
	iAuth, isAuthenticated := types.GetAuthPrincipleGPRC(c)
	if !isAuthenticated {
		return nil, errors.New("unauthenticated request")
	}

	orgRole := iAuth.GetOrganizationRole()
	if orgRole == nil {
		return &protos.GetSubscriptionResponse{
			Code:    400,
			Success: false,
			Error: &protos.Error{
				ErrorCode:    400,
				ErrorMessage: "no organization found",
				HumanMessage: "You are not part of any organization.",
			},
		}, nil
	}

	sub, err := bG.billingService.GetSubscription(c, orgRole.OrganizationId)
	if err != nil {
		bG.logger.Errorf("GetSubscription error: %v", err)
		return &protos.GetSubscriptionResponse{
			Code:    400,
			Success: false,
			Error: &protos.Error{
				ErrorCode:    400,
				ErrorMessage: err.Error(),
				HumanMessage: "Unable to fetch subscription.",
			},
		}, nil
	}

	protoSub := &protos.BillingSubscription{}
	if castErr := utils.Cast(sub, protoSub); castErr != nil {
		bG.logger.Errorf("unable to cast subscription: %v", castErr)
	}

	return &protos.GetSubscriptionResponse{
		Code:    200,
		Success: true,
		Data:    protoSub,
	}, nil
}

func (bG *webBillingGRPCApi) UpdateSubscription(c context.Context, req *protos.UpdateSubscriptionRequest) (*protos.UpdateSubscriptionResponse, error) {
	iAuth, isAuthenticated := types.GetAuthPrincipleGPRC(c)
	if !isAuthenticated {
		return nil, errors.New("unauthenticated request")
	}

	orgRole := iAuth.GetOrganizationRole()
	if orgRole == nil {
		return &protos.UpdateSubscriptionResponse{
			Code:    400,
			Success: false,
			Error: &protos.Error{
				ErrorCode:    400,
				ErrorMessage: "no organization found",
				HumanMessage: "You are not part of any organization.",
			},
		}, nil
	}

	sub, err := bG.billingService.UpdateSubscription(c, iAuth, orgRole.OrganizationId, req.GetPlanSlug())
	if err != nil {
		bG.logger.Errorf("UpdateSubscription error: %v", err)
		return &protos.UpdateSubscriptionResponse{
			Code:    400,
			Success: false,
			Error: &protos.Error{
				ErrorCode:    400,
				ErrorMessage: err.Error(),
				HumanMessage: "Unable to update subscription.",
			},
		}, nil
	}

	protoSub := &protos.BillingSubscription{}
	if castErr := utils.Cast(sub, protoSub); castErr != nil {
		bG.logger.Errorf("unable to cast subscription: %v", castErr)
	}

	return &protos.UpdateSubscriptionResponse{
		Code:    200,
		Success: true,
		Data:    protoSub,
	}, nil
}
