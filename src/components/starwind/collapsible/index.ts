import Collapsible, { collapsible } from "./Collapsible.astro";
import CollapsibleContent, {
  collapsibleContent,
} from "./CollapsibleContent.astro";
import CollapsibleTrigger, {
  collapsibleTrigger,
} from "./CollapsibleTrigger.astro";

const CollapsibleVariants = {
  collapsible,
  collapsibleContent,
  collapsibleTrigger,
};

export {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  CollapsibleVariants,
};

export default {
  Content: CollapsibleContent,
  Root: Collapsible,
  Trigger: CollapsibleTrigger,
};
