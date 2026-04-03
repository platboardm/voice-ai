package internal_billing_service

import (
	"context"
	"fmt"
	"time"

	internal_entity "github.com/rapidaai/api/web-api/internal/entity"
	internal_services "github.com/rapidaai/api/web-api/internal/service"
	"github.com/rapidaai/pkg/commons"
	"github.com/rapidaai/pkg/connectors"
	gorm_models "github.com/rapidaai/pkg/models/gorm"
	"github.com/rapidaai/pkg/types"
	type_enums "github.com/rapidaai/pkg/types/enums"
)

func NewBillingService(logger commons.Logger, postgres connectors.PostgresConnector) internal_services.BillingService {
	return &billingService{
		logger:   logger,
		postgres: postgres,
	}
}

type billingService struct {
	logger   commons.Logger
	postgres connectors.PostgresConnector
}

func (bS *billingService) GetAllPlans(ctx context.Context) ([]*internal_entity.BillingPlan, error) {
	db := bS.postgres.DB(ctx)
	var plans []*internal_entity.BillingPlan
	tx := db.Preload("Quotas").Where("is_active = ?", true).Order("sort_order ASC").Find(&plans)
	if tx.Error != nil {
		bS.logger.Errorf("exception fetching billing plans %v", tx.Error)
		return nil, tx.Error
	}
	return plans, nil
}

func (bS *billingService) GetSubscription(ctx context.Context, orgId uint64) (*internal_entity.BillingSubscription, error) {
	db := bS.postgres.DB(ctx)
	var sub internal_entity.BillingSubscription
	tx := db.Preload("Plan.Quotas").Where("organization_id = ? AND status = ?", orgId, type_enums.RECORD_ACTIVE.String()).First(&sub)
	if tx.Error != nil {
		bS.logger.Errorf("exception fetching billing subscription for org %d: %v", orgId, tx.Error)
		return nil, tx.Error
	}
	return &sub, nil
}

func (bS *billingService) UpdateSubscription(ctx context.Context, auth types.Principle, orgId uint64, planSlug string) (*internal_entity.BillingSubscription, error) {
	db := bS.postgres.DB(ctx)

	var plan internal_entity.BillingPlan
	tx := db.Where("slug = ? AND is_active = ?", planSlug, true).First(&plan)
	if tx.Error != nil {
		return nil, fmt.Errorf("plan not found: %s", planSlug)
	}

	var sub internal_entity.BillingSubscription
	tx = db.Where("organization_id = ?", orgId).First(&sub)
	if tx.Error != nil {
		return nil, fmt.Errorf("subscription not found for organization %d", orgId)
	}

	// Record plan change in metadata history
	history := sub.Metadata
	if history == nil {
		history = make(map[string]interface{})
	}
	var changes []interface{}
	if existing, ok := history["planChanges"]; ok {
		if arr, ok := existing.([]interface{}); ok {
			changes = arr
		}
	}
	changes = append(changes, map[string]interface{}{
		"fromPlanId": sub.BillingPlanId,
		"toPlanId":   plan.Id,
		"changedBy":  auth.GetUserInfo().Id,
		"changedAt":  time.Now().UTC().Format(time.RFC3339),
	})
	history["planChanges"] = changes

	sub.BillingPlanId = plan.Id
	sub.Metadata = history
	sub.UpdatedBy = auth.GetUserInfo().Id
	tx = db.Save(&sub)
	if tx.Error != nil {
		bS.logger.Errorf("exception updating subscription %v", tx.Error)
		return nil, tx.Error
	}

	return bS.GetSubscription(ctx, orgId)
}

func (bS *billingService) ProvisionDefaultPlan(ctx context.Context, auth types.Principle, orgId uint64) (*internal_entity.BillingSubscription, error) {
	db := bS.postgres.DB(ctx)

	var defaultPlan internal_entity.BillingPlan
	tx := db.Where("is_default = ? AND is_active = ?", true, true).First(&defaultPlan)
	if tx.Error != nil {
		bS.logger.Errorf("exception finding default billing plan %v", tx.Error)
		return nil, tx.Error
	}

	sub := &internal_entity.BillingSubscription{
		OrganizationId: orgId,
		BillingPlanId:  defaultPlan.Id,
		Mutable: gorm_models.Mutable{
			Status:    type_enums.RECORD_ACTIVE,
			CreatedBy: auth.GetUserInfo().Id,
		},
	}

	tx = db.Save(sub)
	if tx.Error != nil {
		bS.logger.Errorf("exception provisioning default billing plan for org %d: %v", orgId, tx.Error)
		return nil, tx.Error
	}

	return sub, nil
}
