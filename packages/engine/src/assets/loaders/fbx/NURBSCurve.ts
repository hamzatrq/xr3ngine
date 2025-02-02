import {
	Curve,
	Vector2,
	Vector3,
	Vector4
} from "three";
import * as NURBSUtils from "./NURBSUtils";
/**
 * NURBS curve object
 *
 * Derives from Curve, overriding getPoint and getTangent.
 *
 * Implementation is based on (x, y [, z=0 [, w=1]]) control points with w=weight.
 *
 **/


export class NURBSCurve extends Curve<Vector3> {
	degree: number;
	knots: number[];
	controlPoints: any[];
	startKnot: number;
	endKnot: number;
	
	constructor(degree: number, knots: number[], controlPoints: Vector4[], startKnot: number, endKnot: number) {
		super();
		this.degree = degree;
		this.knots = knots;
		this.controlPoints = [];
		// Used by periodic NURBS to remove hidden spans
		this.startKnot = startKnot || 0;
		this.endKnot = endKnot || (this.knots.length - 1);
		for (let i = 0; i < controlPoints.length; ++i) {

			// ensure Vector4 for control points
			const point = controlPoints[i] as Vector4;
			this.controlPoints[i] = new Vector4(point.x, point.y, point.z, point.w);

		}
	}

	getPoint (t, optionalTarget?) {

		const point = optionalTarget || new Vector3();

		const u = this.knots[this.startKnot] + t * (this.knots[this.endKnot] - this.knots[this.startKnot]); // linear mapping t->u

		// following results in (wx, wy, wz, w) homogeneous point
		const hpoint: any = NURBSUtils.calcBSplinePoint(this.degree, this.knots, this.controlPoints, u);

		if (hpoint.w != 1.0) {

			// project to 3D space: (wx, wy, wz, w) -> (x, y, z, 1)
			hpoint.divideScalar(hpoint.w);

		}

		return point.set(hpoint.x, hpoint.y, hpoint.z);

	}

	getTangent (t, optionalTarget?) {

		const tangent = optionalTarget || new Vector3();

		const u = this.knots[0] + t * (this.knots[this.knots.length - 1] - this.knots[0]);
		const ders = NURBSUtils.calcNURBSDerivatives(this.degree, this.knots, this.controlPoints, u, 1);
		tangent.copy(ders[1]).normalize();

		return tangent;

	}
}

