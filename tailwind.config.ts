import { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./renderer/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./renderer/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./renderer/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  corePlugins: {
    preflight: false,
  },
};

export default config;
