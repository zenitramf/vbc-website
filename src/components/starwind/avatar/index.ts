import Avatar, { avatar } from "./Avatar.astro";
import AvatarFallback, { avatarFallback } from "./AvatarFallback.astro";
import AvatarImage, { avatarImage } from "./AvatarImage.astro";

const AvatarVariants = { avatar, avatarFallback, avatarImage };

export { Avatar, AvatarFallback, AvatarImage, AvatarVariants };

export default {
  Fallback: AvatarFallback,
  Image: AvatarImage,
  Root: Avatar,
};
