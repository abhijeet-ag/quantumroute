// Exact-solver verification: metaheuristics vs brute-force global optimum.
// Generated offline. Small instances where full enumeration is tractable.

export type ExactRow={vehicles:number;enumerated:number;optimum:number;sa:number;saGap:number;qpso:number;qpsoGap:number;ga:number;gaGap:number};
export const EXACT:{rows:ExactRow[];note:string}={"rows":[{"vehicles":6,"enumerated":729,"optimum":684.4,"sa":684.4,"saGap":0,"qpso":684.4,"qpsoGap":0,"ga":684.4,"gaGap":0},{"vehicles":8,"enumerated":6561,"optimum":1122,"sa":1122,"saGap":0,"qpso":1122,"qpsoGap":0,"ga":1122,"gaGap":0},{"vehicles":10,"enumerated":59049,"optimum":1614.5,"sa":1614.5,"saGap":0,"qpso":1614.5,"qpsoGap":0,"ga":1614.5,"gaGap":0}],"note":"Brute-force enumeration of the full assignment space (k=3 candidates per vehicle). Metaheuristics reach the proven global optimum on every small instance tested."};
