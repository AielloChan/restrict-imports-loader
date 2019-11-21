import * as webpack from "webpack";

import * as core from "./core";
import * as loader from "./loader";

export { Decider, Deciders, ImportDetails } from "./core";

export { LoaderOptions, Severity } from "./loader";

export default function(this: webpack.loader.LoaderContext, source: string): string {
    return loader.run(this, source);
}

export function check(
    source: string,
    restricted: core.Deciders,
    fileName?: string,
): ReadonlyArray<ReadonlyArray<core.ImportDetails>> {
    return core.check({
        source: source,
        deciders: restricted,
        fileName: fileName || "",
    });
}

export function everythingIn(packageName: string): RegExp {
    return new RegExp(String.raw`^${packageName}(\/.*)?$`);
}
