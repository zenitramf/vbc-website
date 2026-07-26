import { initCarousel } from './carousel-script';
import type { CarouselApi, CarouselManager, CarouselOptions } from './carousel-script';
import Carousel from "./Carousel.astro";
import CarouselContent from "./CarouselContent.astro";
import CarouselItem from "./CarouselItem.astro";
import CarouselNext from "./CarouselNext.astro";
import CarouselPrevious from "./CarouselPrevious.astro";

export {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
  type CarouselManager,
  CarouselNext,
  type CarouselOptions,
  CarouselPrevious,
  initCarousel,
};

export default {
  Content: CarouselContent,
  Item: CarouselItem,
  Next: CarouselNext,
  Previous: CarouselPrevious,
  Root: Carousel,
  init: initCarousel,
};
