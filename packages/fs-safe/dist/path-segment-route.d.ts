export declare function sameAbsolutePath(left: string, right: string): boolean;
export type PathSegmentRoute = Readonly<{
    joined: string;
    offsets: readonly number[];
}>;
export declare function createPathSegmentRoute(segments: readonly string[]): PathSegmentRoute;
export declare function joinPathSegmentRoute(base: string, route: PathSegmentRoute, offset: number, tail?: string): string;
