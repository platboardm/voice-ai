import React, { FC, useState } from 'react';
import { CreateAssistantTelemetryProvider, Metadata } from '@rapidaai/react';
import { useGlobalNavigation } from '@/hooks/use-global-navigator';
import { useCurrentCredential } from '@/hooks/use-credential';
import { useRapidaStore } from '@/hooks';
import { connectionConfig } from '@/configs';
import toast from 'react-hot-toast/headless';
import {
  PrimaryButton,
  SecondaryButton,
} from '@/app/components/carbon/button';
import { ButtonSet } from '@carbon/react';
import { FieldSet } from '@/app/components/form/fieldset';
import { InputCheckbox } from '@/app/components/form/checkbox';
import { InputHelper } from '@/app/components/input-helper';
import { useConfirmDialog } from '@/app/pages/assistant/actions/hooks/use-confirmation';
import { TelemetryProvider } from '@/app/components/providers/telemetry';
import { PageActionButtonBlock } from '@/app/components/blocks/page-action-button-block';
import {
  GetDefaultTelemetryIfInvalid,
  ValidateTelemetry,
} from '@/app/components/providers/telemetry/provider';
import { TELEMETRY_PROVIDER } from '@/providers';

export const CreateAssistantTelemetry: FC<{ assistantId: string }> = ({
  assistantId,
}) => {
  const navigator = useGlobalNavigation();
  const { authId, token, projectId } = useCurrentCredential();
  const { loading, showLoader, hideLoader } = useRapidaStore();
  const { showDialog, ConfirmDialogComponent } = useConfirmDialog({});

  const defaultProvider = TELEMETRY_PROVIDER[0]?.code || 'otlp_http';
  const [provider, setProvider] = useState(defaultProvider);
  const [parameters, setParameters] = useState<Metadata[]>(() =>
    GetDefaultTelemetryIfInvalid(defaultProvider, []),
  );
  const [enabled, setEnabled] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const onChangeProvider = (providerCode: string) => {
    setProvider(providerCode);
    const credentialOnly = parameters.filter(
      p => p.getKey() === 'rapida.credential_id',
    );
    setParameters(GetDefaultTelemetryIfInvalid(providerCode, credentialOnly));
  };

  const onChangeParameter = (params: Metadata[]) => {
    setParameters(params);
  };

  const onSubmit = () => {
    setErrorMessage('');

    const validationError = ValidateTelemetry(provider, parameters);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    showLoader();
    CreateAssistantTelemetryProvider(
      connectionConfig,
      assistantId,
      provider,
      enabled,
      parameters,
      (err, response) => {
        hideLoader();
        if (err) {
          setErrorMessage(
            'Unable to create assistant telemetry provider, please try again.',
          );
          return;
        }

        if (response?.getSuccess()) {
          toast.success('Assistant telemetry provider created successfully');
          navigator.goToAssistantTelemetry(assistantId);
          return;
        }

        const message = response?.getError()?.getHumanmessage();
        setErrorMessage(
          message ||
            'Unable to create assistant telemetry provider, please try again.',
        );
      },
      {
        'x-auth-id': authId,
        authorization: token,
        'x-project-id': projectId,
      },
    );
  };

  return (
    <>
      <ConfirmDialogComponent />
      <div className="flex flex-col flex-1 min-h-0 bg-white dark:bg-gray-900">
        <header className="px-8 pt-8 pb-6 border-b border-gray-200 dark:border-gray-800 shrink-0">
          <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-gray-500 dark:text-gray-400 mb-1.5">
            Telemetry
          </p>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 leading-tight">
            Create Telemetry Provider
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1.5 leading-relaxed">
            Configure a telemetry destination for this assistant.
          </p>
        </header>

        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="px-8 pt-6 pb-8 max-w-4xl flex flex-col gap-8">
            <TelemetryProvider
              provider={provider}
              onChangeProvider={onChangeProvider}
              parameters={parameters}
              onChangeParameter={onChangeParameter}
            />

            <FieldSet>
              <InputCheckbox
                checked={enabled}
                onChange={e => setEnabled(e.target.checked)}
              >
                Enable this telemetry provider
              </InputCheckbox>
              <InputHelper>
                Disabled providers are saved but not used by the assistant.
              </InputHelper>
            </FieldSet>
          </div>
        </div>

        <PageActionButtonBlock errorMessage={errorMessage}>
          <ButtonSet className="!w-full [&>button]:!flex-1 [&>button]:!max-w-none">
            <SecondaryButton size="lg"
              onClick={() => showDialog(navigator.goBack)}
            >
              Cancel
            </SecondaryButton>
            <PrimaryButton size="lg"
              isLoading={loading}
              onClick={onSubmit}
            >
              Save telemetry
            </PrimaryButton>
          </ButtonSet>
        </PageActionButtonBlock>
      </div>
    </>
  );
};
