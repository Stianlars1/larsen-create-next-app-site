declare module "flubber" {
  export type InterpolateOptions = {
    /** Smaller segments follow the shapes more closely at a higher cost. */
    maxSegmentLength?: number;
    string?: boolean;
  };
  export function interpolate(
    from: string,
    to: string,
    options?: InterpolateOptions,
  ): (t: number) => string;
}
