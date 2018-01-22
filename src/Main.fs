module Main

#if FABLE_COMPILER

open Fable.Core.JsInterop

importSideEffects "./Pages/feature1/list.fs"
importSideEffects "./Pages/feature2/dashboard.fs"

#endif