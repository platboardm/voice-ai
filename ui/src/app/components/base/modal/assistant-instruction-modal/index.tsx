import { GenericModal, ModalProps } from '@/app/components/base/modal';
import { FC, HTMLAttributes, memo } from 'react';
import { ModalHeader } from '@/app/components/base/modal/modal-header';
import { ModalFitHeightBlock } from '@/app/components/blocks/modal-fit-height-block';
import { ExternalLink } from 'lucide-react';
import { ModalBody } from '@/app/components/base/modal/modal-body';
import { ModalFooter } from '@/app/components/base/modal/modal-footer';
import { IBlueBGButton, ICancelButton } from '@/app/components/form/button';
import { CodeHighlighting } from '@/app/components/code-highlighting';
import { DeploymentSectionHeader } from '@/app/components/base/modal/deployment-modal-primitives';
import { ModalTitleBlock } from '@/app/components/blocks/modal-title-block';

interface AssistantInstructionDialogProps
  extends ModalProps,
    HTMLAttributes<HTMLDivElement> {
  assistantId: string;
}

export const AssistantWebwidgetDeploymentDialog: FC<AssistantInstructionDialogProps> =
  memo(({ assistantId, ...mldAttr }) => {
    return (
      <GenericModal {...mldAttr}>
        <ModalFitHeightBlock className="w-[720px]">
          <ModalHeader onClose={() => mldAttr.setModalOpen(false)}>
            <div>
              <ModalTitleBlock>Deployment completed</ModalTitleBlock>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Add the following snippets to your website to start
                receiving messages.
              </p>
            </div>
          </ModalHeader>

          <ModalBody className="gap-0 !p-0">
            <DeploymentSectionHeader label="1. Add script to your HTML" />
            <div className="px-4 py-3">
              <CodeHighlighting
                className="min-h-[20px]"
                code='<script src="https://cdn-01.rapida.ai/public/scripts/app.min.js" defer></script>'
              />
            </div>

            <DeploymentSectionHeader label="2. Initialize the assistant" />
            <div className="px-4 py-3">
              <CodeHighlighting
                className="min-h-[240px]"
                code={`<script>
window.chatbotConfig = {
  assistant_id: "${assistantId}",
  token: "{RAPIDA_PROJECT_KEY}",
  user: {
    id: "{UNIQUE_IDENTIFIER}",
    name: "{NAME}",
  },
  layout: "docked-right",
  position: "bottom-right",
  showLauncher: true,
  name: "Rapida Assistant",
  theme: {
    mode: "light",
  },
};
</script>`}
              />
            </div>
          </ModalBody>

          <ModalFooter>
            <ICancelButton onClick={() => mldAttr.setModalOpen(false)}>
              Close
            </ICancelButton>
            <IBlueBGButton
              type="button"
              onClick={() =>
                window.open('https://doc.rapida.ai', '_blank')
              }
            >
              <span>View Documentation</span>
              <ExternalLink className="w-4 h-4 ml-1" strokeWidth={1.5} />
            </IBlueBGButton>
          </ModalFooter>
        </ModalFitHeightBlock>
      </GenericModal>
    );
  });
