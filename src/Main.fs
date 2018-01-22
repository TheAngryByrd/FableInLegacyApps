module Main

// This is necessary to make webpack collect all test files

type IJQuery = interface end

#if FABLE_COMPILER

open Fable.Core.JsInterop

importSideEffects "./Pages/App.fs"
importSideEffects "./Pages/Counter.fs"

#endif