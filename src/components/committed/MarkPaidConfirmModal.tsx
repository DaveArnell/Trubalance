import { AmountConfirmButton, AmountConfirmModal } from './AmountConfirmModal'

interface MarkPaidConfirmModalProps {
  itemLabel: string
  expectedTotal: number
  onConfirm: (amount: number) => void
  onCancel: () => void
}

export function MarkPaidConfirmModal({
  itemLabel,
  expectedTotal,
  onConfirm,
  onCancel,
}: MarkPaidConfirmModalProps) {
  return (
    <AmountConfirmModal
      title="Confirm payment"
      itemLabel={itemLabel}
      expectedTotal={expectedTotal}
      expectedLabel="Amount due"
      amountLabel="Amount paid"
      confirmSameLabel="Yes, mark paid"
      confirmDiffLabel="Pay and correct history"
      noteSame="Confirming the due amount will mark it paid without changing past history."
      noteDiff="A different amount will correct history from when this cost was added."
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  )
}

interface MarkPaidConfirmButtonProps {
  itemLabel: string
  expectedTotal: number
  onConfirm: (amount: number) => void
  buttonLabel?: string
}

export function MarkPaidConfirmButton({
  itemLabel,
  expectedTotal,
  onConfirm,
  buttonLabel = 'Paid',
}: MarkPaidConfirmButtonProps) {
  return (
    <AmountConfirmButton
      buttonLabel={buttonLabel}
      title="Confirm payment"
      itemLabel={itemLabel}
      expectedTotal={expectedTotal}
      expectedLabel="Amount due"
      amountLabel="Amount paid"
      confirmSameLabel="Yes, mark paid"
      confirmDiffLabel="Pay and correct history"
      noteSame="Confirming the due amount will mark it paid without changing past history."
      noteDiff="A different amount will correct history from when this cost was added."
      onConfirm={onConfirm}
    />
  )
}

interface MarkReceivedConfirmButtonProps {
  itemLabel: string
  expectedTotal: number
  onConfirm: (amount: number) => void
}

export function MarkReceivedConfirmButton({
  itemLabel,
  expectedTotal,
  onConfirm,
}: MarkReceivedConfirmButtonProps) {
  return (
    <AmountConfirmButton
      buttonLabel="Received"
      title="Confirm receipt"
      itemLabel={itemLabel}
      expectedTotal={expectedTotal}
      expectedLabel="Expected amount"
      amountLabel="Amount received"
      confirmSameLabel="Yes, mark received"
      confirmDiffLabel="Receive and correct history"
      noteSame="Confirming the expected amount will mark it received without changing past history."
      noteDiff="A different amount will correct history from when this receipt started."
      onConfirm={onConfirm}
    />
  )
}
