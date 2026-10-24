import { Dialog, Heading, Modal, ModalOverlay } from 'react-aria-components';
import { t } from '../lib/i18n';
import { Button } from './ui';

interface Props {
  message: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Asks for confirmation while `message` is set. */
export function ConfirmDialog({ message, onConfirm, onCancel }: Props) {
  return (
    <ModalOverlay
      isOpen={message !== null}
      onOpenChange={(open) => !open && onCancel()}
      isDismissable
      className="fixed inset-0 z-10 flex items-center justify-center bg-black/40 p-4"
    >
      <Modal className="w-full max-w-sm rounded-lg border border-line bg-card p-4">
        <Dialog role="alertdialog" className="outline-none">
          <Heading slot="title" className="mb-4 text-base font-normal">
            {message}
          </Heading>
          <div className="flex justify-end gap-2">
            <Button autoFocus onClick={onCancel}>
              {t('cancel')}
            </Button>
            <Button variant="primary" onClick={onConfirm}>
              {t('proceed')}
            </Button>
          </div>
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}
