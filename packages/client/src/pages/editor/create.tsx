import dynamic from "next/dynamic";

/**
 * Exporting component by dynamicaly loaded component.
 */
export default dynamic(() => import("@xr3ngine/client-core/src/world/components/editor/projects/CreateProjectPage"));
