import type {
  PromiseOptions,
  PromiseStateOption,
  ToastOptions,
  Variant,
} from "./toast-manager";
import { toast } from "./toast-manager";
import ToastDescription from "./ToastDescription.astro";
import Toaster from "./Toaster.astro";
import ToastItem from "./ToastItem.astro";
import ToastTemplate from "./ToastTemplate.astro";
import ToastTitle from "./ToastTitle.astro";

export {
  type PromiseOptions,
  type PromiseStateOption,
  toast,
  ToastDescription,
  Toaster,
  ToastItem,
  type ToastOptions,
  ToastTemplate,
  ToastTitle,
  type Variant,
};

export default {
  Description: ToastDescription,
  Item: ToastItem,
  Manager: toast,
  Template: ToastTemplate,
  Title: ToastTitle,
  Viewport: Toaster,
};
