import { FormulaRegistry } from "./formulaRegistry.js";
import { FleschKincaidGradeLevel, FleschReadingEase } from "./impls/flesch.js";
import { WienerSachtextformel } from "./impls/german.js";
import { Crawford, FernandezHuerta, GutierrezPolini, SzigrisztPazos } from "./impls/spanish.js";
import { DaleChall, FogPL, Gulpease, Osman, Spache } from "./impls/misc.js";
import {
  AutomatedReadabilityIndex,
  ColemanLiau,
  GunningFog,
  Lix,
  SmogIndex,
} from "./impls/universal.js";

/** Builds a `FormulaRegistry` with all 17 formulas registered. */
export class FormulaRegistryFactory {
  static create(): FormulaRegistry {
    const registry = new FormulaRegistry();
    registry.register(new AutomatedReadabilityIndex());
    registry.register(new ColemanLiau());
    registry.register(new Crawford());
    registry.register(new DaleChall());
    registry.register(new FernandezHuerta());
    registry.register(new FleschKincaidGradeLevel());
    registry.register(new FleschReadingEase());
    registry.register(new FogPL());
    registry.register(new Gulpease());
    registry.register(new GunningFog());
    registry.register(new GutierrezPolini());
    registry.register(new Lix());
    registry.register(new Osman());
    registry.register(new SmogIndex());
    registry.register(new Spache());
    registry.register(new SzigrisztPazos());
    registry.register(new WienerSachtextformel());
    return registry;
  }
}
