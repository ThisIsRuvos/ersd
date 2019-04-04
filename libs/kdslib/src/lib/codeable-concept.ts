import { ICoding } from './coding';

export interface ICodeableConcept {
  coding?: ICoding[];
  text?: string;
}
