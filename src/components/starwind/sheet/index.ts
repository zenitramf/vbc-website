import Sheet from "./Sheet.astro";
import SheetClose from "./SheetClose.astro";
import SheetContent, {
  dialogBackdrop,
  sheetCloseButton,
  sheetContent,
} from "./SheetContent.astro";
import SheetDescription, { sheetDescription } from "./SheetDescription.astro";
import SheetFooter, { sheetFooter } from "./SheetFooter.astro";
import SheetHeader, { sheetHeader } from "./SheetHeader.astro";
import SheetTitle, { sheetTitle } from "./SheetTitle.astro";
import SheetTrigger from "./SheetTrigger.astro";

const SheetVariants = {
  dialogBackdrop,
  sheetCloseButton,
  sheetContent,
  sheetDescription,
  sheetFooter,
  sheetHeader,
  sheetTitle,
};

export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetVariants,
};

export default {
  Close: SheetClose,
  Content: SheetContent,
  Description: SheetDescription,
  Footer: SheetFooter,
  Header: SheetHeader,
  Root: Sheet,
  Title: SheetTitle,
  Trigger: SheetTrigger,
};
