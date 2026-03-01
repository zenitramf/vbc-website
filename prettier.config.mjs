import ultracite from "ultracite/prettier";

// eslint-disable-next-line import/no-anonymous-default-export
export default {
  ...ultracite,
  overrides: [
    {
      files: "*.astro",
      options: { parser: "astro" },
    },
  ],
  plugins: [...(ultracite.plugins || []), "prettier-plugin-astro"],
};
