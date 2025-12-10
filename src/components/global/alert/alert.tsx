"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";

export default function AlertBox({
  open,
  message,
  onClose,
}: {
  open: boolean;
  message: string;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-white rounded-2xl p-6 max-w-sm text-center border-0 shadow-xl">
        <p className="text-base font-semibold text-gray-800">{message}</p>

        <button
          onClick={onClose}
          className="mt-4 w-full bg-purple-600 hover:bg-purple-700 text-white rounded-lg py-2 text-sm font-medium transition"
        >
          OK
        </button>
      </DialogContent>
    </Dialog>
  );
}
