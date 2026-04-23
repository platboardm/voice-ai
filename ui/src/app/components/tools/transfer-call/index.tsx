import { FC } from 'react';
import {
  FormGroup,
  Stack,
  TextArea,
  TextInput,
} from '@/app/components/carbon/form';
import {
  ConfigureToolProps,
  ToolDefinitionForm,
  useParameterManager,
} from '../common';
import { InputGroup } from '../../input-group';

export const ConfigureTransferCall: FC<ConfigureToolProps> = ({
  toolDefinition,
  onChangeToolDefinition,
  inputClass,
  parameters,
  onParameterChange,
}) => {
  const { getParamValue, updateParameter } = useParameterManager(
    parameters,
    onParameterChange,
  );

  return (
    <>
      <InputGroup title="Action Definition">
        <Stack gap={7}>
          <TextInput
            id="transfer-to"
            labelText="Transfer to"
            helperText="The phone number or SIP URI to transfer calls to (e.g. +14155551234 or sip:agent@example.com)."
            value={getParamValue('tool.transfer_to')}
            onChange={e => updateParameter('tool.transfer_to', e.target.value)}
            placeholder="+14155551234"
          />
          <TextArea
            id="transfer-message"
            labelText="Transfer Message"
            helperText="The message to be played when transferring the call."
            value={getParamValue('tool.transfer_message')}
            onChange={e =>
              updateParameter('tool.transfer_message', e.target.value)
            }
            placeholder="Your transfer message"
          />
        </Stack>
      </InputGroup>

      {toolDefinition && onChangeToolDefinition && (
        <ToolDefinitionForm
          toolDefinition={toolDefinition}
          onChangeToolDefinition={onChangeToolDefinition}
          inputClass={inputClass}
          documentationUrl="https://doc.rapida.ai/assistants/tools/add-transfer-call-tool"
          documentationTitle="Know more about Transfer Call that can be supported by rapida"
        />
      )}
    </>
  );
};
