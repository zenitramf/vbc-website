import AlertDialog from "./AlertDialog.astro";
import AlertDialogAction from "./AlertDialogAction.astro";
import AlertDialogCancel from "./AlertDialogCancel.astro";
import AlertDialogContent, {
  alertDialogBackdrop,
  alertDialogContent,
} from "./AlertDialogContent.astro";
import AlertDialogDescription, {
  alertDialogDescription,
} from "./AlertDialogDescription.astro";
import AlertDialogFooter, {
  alertDialogFooter,
} from "./AlertDialogFooter.astro";
import AlertDialogHeader, {
  alertDialogHeader,
} from "./AlertDialogHeader.astro";
import AlertDialogTitle, { alertDialogTitle } from "./AlertDialogTitle.astro";
import AlertDialogTrigger from "./AlertDialogTrigger.astro";

const AlertDialogVariants = {
  alertDialogBackdrop,
  alertDialogContent,
  alertDialogDescription,
  alertDialogFooter,
  alertDialogHeader,
  alertDialogTitle,
};

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertDialogVariants,
};

export default {
  Action: AlertDialogAction,
  Cancel: AlertDialogCancel,
  Content: AlertDialogContent,
  Description: AlertDialogDescription,
  Footer: AlertDialogFooter,
  Header: AlertDialogHeader,
  Root: AlertDialog,
  Title: AlertDialogTitle,
  Trigger: AlertDialogTrigger,
};
