import { GlobalRegistrator } from "@happy-dom/global-registrator";
GlobalRegistrator.register();
// Tell React it's in a test environment so act() works without warnings
(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
