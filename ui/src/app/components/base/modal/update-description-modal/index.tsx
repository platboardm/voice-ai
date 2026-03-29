import { PrimaryButton, SecondaryButton } from '@/app/components/carbon/button';
import { ErrorMessage } from '@/app/components/form/error-message';
import { ModalProps } from '@/app/components/base/modal';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/app/components/carbon/modal';
import { useRapidaStore } from '@/hooks';
import React, { useEffect, useState } from 'react';
import { FieldSet } from '@/app/components/form/fieldset';
import { Input } from '@/app/components/form/input';
import { FormLabel } from '@/app/components/form-label';
import { Textarea } from '@/app/components/form/textarea';

interface UpdateDescriptionDialogProps extends ModalProps {
  title?: string;
  name?: string;
  description?: string;
  onUpdateDescription: (
    name: string,
    description: string,
    onError: (err: string) => void,
    onSuccess: () => void,
  ) => void;
}

export function UpdateDescriptionDialog(props: UpdateDescriptionDialogProps) {
  const [error, setError] = useState('');
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const rapidaStore = useRapidaStore();

  useEffect(() => {
    if (props.name) setName(props.name);
    if (props.description) setDescription(props.description);
  }, [props.name, props.description]);

  const onUpdateDescription = () => {
    rapidaStore.showLoader('overlay');
    props.onUpdateDescription(
      name,
      description,
      err => {
        rapidaStore.hideLoader();
        setError(err);
      },
      () => {
        rapidaStore.hideLoader();
        props.setModalOpen(false);
      },
    );
  };

  return (
    <Modal open={props.modalOpen} onClose={() => props.setModalOpen(false)} size="sm">
      <ModalHeader title={props.title} onClose={() => props.setModalOpen(false)} />

      <ModalBody hasForm>
        <FieldSet>
          <FormLabel>Name</FormLabel>
          <Input
            name="usecase"
            value={name}
            placeholder="e.g. emotion detector"
            onChange={e => setName(e.target.value)}
          />
        </FieldSet>

        <FieldSet>
          <FormLabel>Description</FormLabel>
          <Textarea
            rows={4}
            value={description}
            placeholder="Provide a readable description and how to use it."
            onChange={v => setDescription(v.target.value)}
          />
        </FieldSet>

        <ErrorMessage message={error} />
      </ModalBody>

      <ModalFooter>
        <SecondaryButton size="lg" onClick={() => props.setModalOpen(false)}>
          Cancel
        </SecondaryButton>
        <PrimaryButton
          size="lg"
          type="button"
          onClick={onUpdateDescription}
          isLoading={rapidaStore.loading}
        >
          Save changes
        </PrimaryButton>
      </ModalFooter>
    </Modal>
  );
}
