import React, { FC, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useGlobalNavigation } from '@/hooks/use-global-navigator';
import { toHumanReadableDateTime } from '@/utils/date';
import { Activity, Pencil, Plus, RotateCw, Trash2 } from 'lucide-react';
import { useCurrentCredential } from '@/hooks/use-credential';
import { SectionLoader } from '@/app/components/loader/section-loader';
import { IButton } from '@/app/components/form/button';
import toast from 'react-hot-toast/headless';
import { ActionableEmptyMessage } from '@/app/components/container/message/actionable-empty-message';
import { cn } from '@/utils';
import { CreateAssistantTelemetry } from './create-assistant-telemetry';
import { UpdateAssistantTelemetry } from './update-assistant-telemetry';
import { useAssistantTelemetryPageStore } from '@/app/pages/assistant/actions/store/use-telemetry-page-store';
import { useConfirmDialog } from '@/app/pages/assistant/actions/hooks/use-confirmation';
import { PageHeaderBlock } from '@/app/components/blocks/page-header-block';
import { PageTitleBlock } from '@/app/components/blocks/page-title-block';
import { BaseCard } from '@/app/components/base/cards';
import { RevisionIndicator } from '@/app/components/indicators/revision';
import { TELEMETRY_PROVIDER } from '@/providers';

export function ConfigureAssistantTelemetryPage() {
  const { assistantId } = useParams();
  return (
    <>
      {assistantId && <ConfigureAssistantTelemetry assistantId={assistantId} />}
    </>
  );
}

export function CreateAssistantTelemetryPage() {
  const { assistantId } = useParams();
  return (
    <>{assistantId && <CreateAssistantTelemetry assistantId={assistantId} />}</>
  );
}

export function UpdateAssistantTelemetryPage() {
  const { assistantId } = useParams();
  return (
    <>{assistantId && <UpdateAssistantTelemetry assistantId={assistantId} />}</>
  );
}

const providerNameByCode = new Map(
  TELEMETRY_PROVIDER.map(p => [p.code, p.name]),
);

const CardAction = ({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof Pencil;
  label: string;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="flex items-center gap-2 px-4 h-8 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors whitespace-nowrap"
  >
    <Icon className="w-4 h-4 shrink-0" strokeWidth={1.5} />
    {label}
  </button>
);

const Info = ({ label, value }: { label: string; value: string }) => (
  <div>
    <dt className="text-[10px] font-medium uppercase tracking-[0.08em] text-gray-400 dark:text-gray-500">
      {label}
    </dt>
    <dd className="mt-0.5 text-xs font-medium text-gray-700 dark:text-gray-200">
      {value}
    </dd>
  </div>
);

const ConfigureAssistantTelemetry: FC<{ assistantId: string }> = ({
  assistantId,
}) => {
  const navigation = useGlobalNavigation();
  const action = useAssistantTelemetryPageStore();
  const { authId, token, projectId } = useCurrentCredential();
  const [loading, setLoading] = useState(true);
  const { showDialog, ConfirmDialogComponent } = useConfirmDialog({
    title: 'Delete telemetry?',
    content: 'This telemetry provider will be removed from the assistant.',
  });

  useEffect(() => {
    get();
  }, []);

  const get = () => {
    setLoading(true);
    action.getAssistantTelemetry(
      assistantId,
      projectId,
      token,
      authId,
      e => {
        toast.error(e);
        setLoading(false);
      },
      () => {
        setLoading(false);
      },
    );
  };

  const deleteTelemetry = (telemetryId: string) => {
    setLoading(true);
    action.deleteAssistantTelemetry(
      assistantId,
      telemetryId,
      projectId,
      token,
      authId,
      e => {
        toast.error(e);
        setLoading(false);
      },
      () => {
        toast.success('Telemetry provider deleted successfully');
        get();
      },
    );
  };

  const telemetryCount = action.telemetries.length;

  return (
    <div className="flex flex-col w-full flex-1 overflow-auto bg-white dark:bg-gray-900">
      <ConfirmDialogComponent />

      <PageHeaderBlock>
        <div className="flex items-center gap-3">
          <PageTitleBlock>Telemetry</PageTitleBlock>
          {telemetryCount > 0 && (
            <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-medium tabular-nums">
              {telemetryCount}
            </span>
          )}
        </div>
        <div className="flex items-stretch self-stretch border-l border-gray-200 dark:border-gray-800">
          <IButton type="button" className="h-full" onClick={get}>
            <RotateCw className="w-4 h-4" strokeWidth={1.5} />
          </IButton>
          <div className="w-px self-stretch bg-gray-200 dark:bg-gray-800 shrink-0" />
          <button
            type="button"
            onClick={() => navigation.goToCreateAssistantTelemetry(assistantId)}
            className="flex items-center gap-2 px-4 text-sm text-white bg-primary hover:bg-primary/90 transition-colors whitespace-nowrap"
          >
            Add telemetry
            <Plus className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>
      </PageHeaderBlock>

      {loading ? (
        <div className="flex flex-col flex-1 items-center justify-center">
          <SectionLoader />
        </div>
      ) : telemetryCount > 0 ? (
        <div
          className={cn(
            'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 content-start',
            'm-4',
          )}
        >
          {action.telemetries.map(row => {
            const providerType = row.getProvidertype();
            const providerName =
              providerNameByCode.get(providerType) || providerType;
            const isEnabled = row.getEnabled();
            const optionsCount = row.getOptionsList().length;

            return (
              <BaseCard key={row.getId()}>
                <div className="flex-1 p-4 md:p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <Activity
                      className="w-6 h-6 text-blue-600 shrink-0"
                      strokeWidth={1.5}
                    />
                    <RevisionIndicator
                      status={isEnabled ? 'DEPLOYED' : 'NOT_DEPLOYED'}
                      size="small"
                    />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                      {providerName}
                    </p>
                    <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400 leading-snug">
                      {isEnabled ? 'Enabled' : 'Disabled'} telemetry exporter
                    </p>
                  </div>
                  <dl className="grid grid-cols-3 gap-x-3 gap-y-3 pt-1">
                    <Info label="Provider" value={providerType} />
                    <Info label="Options" value={String(optionsCount)} />
                    <Info
                      label="Created"
                      value={
                        row.getCreateddate()
                          ? toHumanReadableDateTime(row.getCreateddate()!)
                          : '—'
                      }
                    />
                  </dl>
                </div>
                <div className="flex items-stretch border-t border-gray-200 dark:border-gray-800 divide-x divide-gray-200 dark:divide-gray-800">
                  <CardAction
                    icon={Pencil}
                    label="Edit"
                    onClick={() =>
                      navigation.goToEditAssistantTelemetry(
                        assistantId,
                        row.getId(),
                      )
                    }
                  />
                  <CardAction
                    icon={Trash2}
                    label="Delete"
                    onClick={() =>
                      showDialog(() => deleteTelemetry(row.getId()))
                    }
                  />
                </div>
              </BaseCard>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col flex-1 items-center justify-center">
          <ActionableEmptyMessage
            title="No telemetry providers"
            subtitle="Add a telemetry destination to export events and metrics from this assistant."
            action="Add telemetry"
            onActionClick={() =>
              navigation.goToCreateAssistantTelemetry(assistantId)
            }
          />
        </div>
      )}
    </div>
  );
};
