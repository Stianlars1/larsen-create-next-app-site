import { inter } from "./inter/inter";
import { geistMono } from "./geist/geist";

/** Applied to <html> so the token font stacks resolve. */
export const fontVariables = [inter.variable, geistMono.variable].join(" ");
