import InputGroup, { inputGroup } from "./InputGroup.astro";
import InputGroupAddon, { inputGroupAddon } from "./InputGroupAddon.astro";
import InputGroupButton, { inputGroupButton } from "./InputGroupButton.astro";
import InputGroupInput, { inputGroupInput } from "./InputGroupInput.astro";
import InputGroupText from "./InputGroupText.astro";
import InputGroupTextarea, {
  inputGroupTextarea,
} from "./InputGroupTextarea.astro";

const InputGroupVariants = {
  inputGroup,
  inputGroupAddon,
  inputGroupButton,
  inputGroupInput,
  inputGroupTextarea,
};

export {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
  InputGroupVariants,
};

export default {
  Addon: InputGroupAddon,
  Button: InputGroupButton,
  Input: InputGroupInput,
  Root: InputGroup,
  Text: InputGroupText,
  Textarea: InputGroupTextarea,
};
