import Dialog from "./Dialog.astro";
import DialogClose from "./DialogClose.astro";
import DialogContent, {
  dialogBackdrop,
  dialogCloseButton,
  dialogContent,
} from "./DialogContent.astro";
import DialogDescription, {
  dialogDescription,
} from "./DialogDescription.astro";
import DialogFooter, { dialogFooter } from "./DialogFooter.astro";
import DialogHeader, { dialogHeader } from "./DialogHeader.astro";
import DialogTitle, { dialogTitle } from "./DialogTitle.astro";
import DialogTrigger from "./DialogTrigger.astro";

const DialogVariants = {
  dialogBackdrop,
  dialogCloseButton,
  dialogContent,
  dialogDescription,
  dialogFooter,
  dialogHeader,
  dialogTitle,
};

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogVariants,
};

export default {
  Close: DialogClose,
  Content: DialogContent,
  Description: DialogDescription,
  Footer: DialogFooter,
  Header: DialogHeader,
  Root: Dialog,
  Title: DialogTitle,
  Trigger: DialogTrigger,
};
