package internal_entity

import (
	gorm_model "github.com/rapidaai/pkg/models/gorm"
	gorm_types "github.com/rapidaai/pkg/models/gorm/types"
)

type BillingPlan struct {
	gorm_model.Audited
	Name         string                  `json:"name" gorm:"type:string;size:100;not null"`
	Slug         string                  `json:"slug" gorm:"type:string;size:50;not null;uniqueIndex"`
	Description  string                  `json:"description" gorm:"type:text;default:''"`
	IsDefault    bool                    `json:"isDefault" gorm:"type:bool;default:false"`
	IsActive     bool                    `json:"isActive" gorm:"type:bool;default:true"`
	SortOrder    int                     `json:"sortOrder" gorm:"type:int;default:0"`
	PriceMonthly int64                   `json:"priceMonthly" gorm:"type:bigint;default:0"`
	PriceYearly  int64                   `json:"priceYearly" gorm:"type:bigint;default:0"`
	Currency     string                  `json:"currency" gorm:"type:string;size:10;default:'usd'"`
	StripeUrl    string                  `json:"stripeUrl" gorm:"column:stripe_url;type:text;default:''"`
	Metadata     gorm_types.InterfaceMap `json:"metadata" gorm:"type:jsonb;default:'{}'"`
	Quotas       []BillingPlanQuota      `json:"quotas" gorm:"foreignKey:BillingPlanId"`
}

type BillingPlanQuota struct {
	gorm_model.Audited
	BillingPlanId uint64 `json:"billingPlanId" gorm:"type:bigint;not null;uniqueIndex:idx_plan_resource"`
	ResourceType  string `json:"resourceType" gorm:"type:string;size:100;not null;uniqueIndex:idx_plan_resource"`
	QuotaLimit    int64  `json:"quotaLimit" gorm:"type:bigint;not null;default:-1"`
}

type BillingSubscription struct {
	gorm_model.Audited
	gorm_model.Mutable
	OrganizationId     uint64                  `json:"organizationId" gorm:"type:bigint;not null;uniqueIndex"`
	BillingPlanId      uint64                  `json:"billingPlanId" gorm:"type:bigint;not null"`
	BillingInterval    string                  `json:"billingInterval" gorm:"type:string;size:20;default:'monthly'"`
	CurrentPeriodStart gorm_model.TimeWrapper  `json:"currentPeriodStart" gorm:"type:timestamp;not null;default:NOW()"`
	CurrentPeriodEnd   *gorm_model.TimeWrapper `json:"currentPeriodEnd" gorm:"type:timestamp"`
	Metadata           gorm_types.InterfaceMap `json:"metadata" gorm:"type:jsonb;default:'{}'"`
	Plan               BillingPlan             `json:"plan" gorm:"foreignKey:BillingPlanId"`
}

func (BillingPlan) TableName() string {
	return "billing_plans"
}

func (BillingPlanQuota) TableName() string {
	return "billing_plan_quotas"
}

func (BillingSubscription) TableName() string {
	return "billing_subscriptions"
}
