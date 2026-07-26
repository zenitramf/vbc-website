import RadioGroup, { radioGroup } from "./RadioGroup.astro";
import RadioGroupItem, {
  radioControl,
  radioIndicator,
  radioItem,
  radioWrapper,
} from "./RadioGroupItem.astro";
import type { RadioGroupChangeEvent } from "./RadioGroupTypes";

const RadioGroupVariants = {
  radioControl,
  radioGroup,
  radioIndicator,
  radioItem,
  radioWrapper,
};

export {
  RadioGroup,
  type RadioGroupChangeEvent,
  RadioGroupItem,
  RadioGroupVariants,
};

export default {
  Item: RadioGroupItem,
  Root: RadioGroup,
};
