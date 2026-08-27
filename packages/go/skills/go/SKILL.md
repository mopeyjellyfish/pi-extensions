---
name: go
description: >
  Expert Go programming skill Covers idiomatic Go — package design, error handling, interfaces, concurrency, testing, and
  project layout, current through Go 1.25. Use whenever Go code is written, reviewed, debugged, or
  refactored — any .go file, go.mod, CLI tool, or web service, and whenever the user mentions
  Go or golang, even if they don't ask for "idiomatic" code.
---

# Idiomatic Go: The Go Way

Idiomatic Go patterns and best practices for building robust, efficient, and maintainable applications.

## When to Activate

- Writing new Go code
- Reviewing or auditing existing Go code
- Refactoring Go code (especially code that looks like Java/Spring Boot patterns in Go)
- Designing Go packages, modules, or APIs
- Choosing between stdlib and third-party libraries
- Any question about Go project structure, error handling, concurrency, or testing

## Core Principles

### 1. Clear is Better than Clever

Go favors readability and simplicity over abstraction and cleverness. Code should be obvious. If you have to read a function three times to understand its control flow, it needs to be rewritten.

```go
// Idiomatic: Direct, linear control flow. Note: no "Get" prefix — Go omits it.
func LookupUser(id string) (*User, error) {
    user, err := db.FindUser(id)
    if err != nil {
        return nil, fmt.Errorf("finding user %s: %w", id, err)
    }
    return user, nil
}
```

### 2. Make the Zero Value Useful

Design types so their zero value is immediately usable without initialization. This eliminates boilerplate constructors. `sync.Mutex` and `bytes.Buffer` are the gold standard for this.

```go
// Idiomatic: Ready to use immediately
type Counter struct {
    mu    sync.Mutex
    count int
}

func (c *Counter) Inc() {
    c.mu.Lock()
    c.count++
    c.mu.Unlock()
}
```

### 3. Return Early, Keep the Happy Path Left

Handle errors and edge cases immediately and return. Do not use `else` blocks for the main logic. The "happy path" of your function should never be indented.

## Package Organization: Flat by Default

**Anti-Pattern:** Using deeply nested directory trees or relying heavily on an `internal/` folder by default to artificially enforce "Clean Architecture" layers. This leads to circular dependencies and difficult navigation.

### 1. The Single-Package Default

Start flat. If you are building a microservice or a simple tool, put everything in the root directory (or alongside your `main.go`). Only create a new package when you truly need a new namespace to clarify the code, or when you need to decouple a strictly independent domain.

### 2. The Proper Use of `internal/`

The `internal/` directory has a specific compiler enforcement: it prevents other modules from importing the code inside it.

- **For Applications:** If you are building an executable binary, nobody can import your code anyway. Using `internal/` here is usually just adding unnecessary path depth.
- **For Libraries:** Use `internal/` sparingly. It should be reserved for complex subsystems where you need to share exported types between your own packages, but absolutely must prevent end-users from relying on those types.

```
// Idiomatic: A flat, feature-focused library or simple app
myproject/
├── main.go           # Entry point (if application)
├── server.go         # Core logic
├── config.go         # Configuration
├── parser.go         # Domain specific parsing
├── parser_test.go
├── go.mod
└── go.sum
```

### 3. Domain Packages for Service Applications

When an application has genuinely distinct, independently-testable domains, give each its own top-level package. The rule is still **one level deep** — no `internal/` nesting, no Clean Architecture layers. Each package owns one concern. `main.go` wires them together.

The signal to create a package: can this domain be described in one sentence, and does it have no knowledge of the other packages? If yes, it earns its own package.

```
// Idiomatic: A web service with distinct domain packages
myservice/
├── main.go        # wires everything together; no business logic here
├── config/        # Config struct, env loading
├── auth/          # identity verification, session middleware
├── db/            # data store client + all queries
├── storage/       # blob storage (S3, R2, GCS)
├── billing/       # payment provider + credit ledger
├── jobs/          # job lifecycle + queue dispatch + worker handler (same domain, one package)
├── web/           # HTTP handlers + HTML templates + static assets (tightly coupled by design)
├── transcribe/    # domain-specific processing — independent pure functions
├── Makefile
├── Dockerfile
└── .env.example
```

**Rules for domain packages:**
- Each package has **one clear purpose** — name it after what it does, not what layer it is (`jobs/`, not `service/`)
- Packages do not import each other sideways — cycles are a sign of wrong boundaries; `main` is the wiring point
- Related sub-concerns that always travel together stay in one package (e.g. job creation + worker handler both live in `jobs/` because they share the job lifecycle domain)
- HTTP handlers and the templates they render belong together in `web/` — they are tightly coupled by design
- Do not create `utils/`, `helpers/`, or `common/` packages — these are symptoms of unclear ownership

**Anti-pattern to reject:** Clean Architecture / DDD layers (`service/`, `repository/`, `controller/`, `domain/`). These layer-named packages cause circular imports, force interface proliferation, and add zero clarity in Go. Domain-named packages (`auth/`, `billing/`, `jobs/`) are the correct middle ground between "too flat" and "over-engineered."

## Interface Design

### 1. Interfaces are Discovered, Not Designed Upfront

Write concrete types first. Only define an interface when you discover that multiple types need to be used interchangeably by a consumer.

### 2. Define Interfaces Where They Are Used

Interfaces belong in the package that *consumes* them, not the package that *implements* them. This decouples your packages.

```go
// processor/processor.go

// Idiomatic: The consumer defines exactly what it needs.
// The concrete 'UserStore' doesn't even need to know this interface exists.
type UserFetcher interface {
    FetchUser(id string) (*User, error)
}

type Processor struct {
    fetcher UserFetcher
}
```

### 3. Accept Interfaces, Return Structs

Require the smallest interface possible as an input parameter (e.g., `io.Reader` instead of `*os.File`), but return a concrete struct so callers aren't forced to use type assertions to access specific fields or methods.

## Library API Design

### Domain Object as Entry Point

When designing a Go library that wraps a stateful resource (a vault, a database connection, a config store), make that resource struct the primary object. Its methods return domain-typed sub-objects. **Avoid:**

- Passing a config/resource struct as the first argument to every package-level function
- Package-level global state (like pflag's default `FlagSet`) for library code that may be embedded

**Do this instead:**

```go
// Open the primary resource once
v, err := vault.Open(path)

// Domain operations are methods on the primary object
// Each call is stateless (reloads fresh) — no cached state on the struct
idx, err := v.People()             // returns *people.Index, error
note, err := v.Daily(time.Now())   // returns *daily.Note, error
mtgs, err := v.Meetings()          // returns *meetings.Index, error

// Domain types live in sub-packages — callers use type inference
p, err := idx.FindOne("Steve")     // *people.Person
```

**Why this pattern:**

- The primary struct (`Vault`) is the single entry point — callers need just one import to get started
- Sub-packages define the rich domain types (`people.Person`, `daily.Note`) — each type lives with the logic that owns it
- No global state means the library is safe for concurrent use, multiple instances, and testing
- Stateless method calls (reload fresh each time) keep the struct simple — no cache invalidation logic needed
- Type inference (`:=`) means callers rarely need to explicitly import sub-packages for variable declarations

**When to use a global instance instead:** Only for CLI-only tools (like `pflag` itself) where there is truly only ever one instance and ease of use for end-users outweighs library correctness.

## Concurrency Patterns

**Anti-Pattern:** Heavy, static Worker Pools. Go's scheduler is incredibly efficient; you don't need to manually manage pools of workers like OS threads in other languages.

### 1. Share Memory by Communicating

Don't use mutexes to protect shared data if you can pass that data over a channel instead. Channels orchestrate execution; mutexes serialize execution.

### 2. Bounded Concurrency

To limit concurrency, use `errgroup` with `SetLimit`. Don't hand-roll a semaphore channel or a rigid worker pool when this exists.

```go
func FetchAll(ctx context.Context, urls []string, maxConcurrent int) error {
    g, ctx := errgroup.WithContext(ctx)
    g.SetLimit(maxConcurrent)

    for _, url := range urls {
        g.Go(func() error {
            return fetch(ctx, url)
        })
    }

    return g.Wait()
}
```

Loop variables are per-iteration since Go 1.22 — never emit the old `url := url` capture line.

When you don't need error propagation, `sync.WaitGroup.Go` (Go 1.25) removes the Add/Done boilerplate:

```go
var wg sync.WaitGroup
for _, url := range urls {
    wg.Go(func() { process(url) })
}
wg.Wait()
```

### 3. Never Start a Goroutine Without Knowing How It Stops

Every `go func()` must have a clear exit condition, usually governed by a `context.Context` or a closed channel.

## Configuration and Struct Design

### Functional Options Are a Trade-off

Do not use functional options by default. Select the simplest API that keeps call sites clear and leaves credible room for change.

#### Choose the simplest configuration shape

- **Use ordinary parameters when** the values are few, required, and clear at the call site.
- **Use a configuration struct when** callers usually set several related values, configuration is data that must be inspected or serialized, or callers reuse the same configuration. Prefer keyed literals. Define how zero values and `nil` select defaults. If zero is also a valid explicit value, use a presence field, pointer, or option to distinguish it from "unset."
- **Use functional options when** most callers use defaults, settings are optional or uncommon, individual options need substantial documentation or validation, and a public constructor needs an additive path for future settings.

Keep required identity and resource inputs as ordinary parameters. The official Go article [Contexts and structs](https://go.dev/blog/context-and-structs) requires `context.Context` to stay explicit as the first parameter of operations that need it. `NewClient(baseURL, WithTimeout(d))` is clearer than hiding `baseURL` in an option.

For a published function, adding a variadic options parameter later can still break callers that use the function's exact type. Add a new constructor or method instead. The [Go module compatibility guidance](https://go.dev/blog/module-compatibility) explains this trade-off and also requires a defined policy for duplicate options.

#### Use a private configuration value

Apply options to a private configuration value, not to a partially initialized live object. Establish defaults first. Validate all settings before the constructor opens files, starts goroutines, or acquires other resources.

```go
type Server struct {
    addr    string
    timeout time.Duration
}

type serverConfig struct {
    timeout time.Duration
}

type Option func(*serverConfig) error

func WithTimeout(d time.Duration) Option {
    return func(cfg *serverConfig) error {
        if d <= 0 {
            return fmt.Errorf("timeout must be positive: %s", d)
        }
        cfg.timeout = d
        return nil
    }
}

func NewServer(addr string, opts ...Option) (*Server, error) {
    cfg := serverConfig{
        timeout: 30 * time.Second,
    }

    for i, opt := range opts {
        if opt == nil {
            return nil, fmt.Errorf("server option %d is nil", i)
        }
        if err := opt(&cfg); err != nil {
            return nil, fmt.Errorf("apply server option %d: %w", i, err)
        }
    }

    // Validate cross-field invariants here, before starting resources.
    return &Server{addr: addr, timeout: cfg.timeout}, nil
}
```

Use `type Option func(*serverConfig)` when every option is infallible. Do not hide invalid input merely to keep that simpler signature.

#### Define the option contract

- Options are applied in call order. Follow Google's default contract: the last duplicate scalar option wins, and cumulative options accumulate. Reject duplicates or conflicts only when that policy is safer, and document the exception.
- Avoid hidden order dependencies. Validate conflicting or incomplete combinations after all options run.
- Use descriptive option names and one predictable convention. `Timeout(d)` is concise. Use `WithTimeout(d)` when `With` usefully distinguishes an option constructor from another API. For booleans and enums, prefer a value parameter over presence-only names when callers can select the value dynamically.
- Keep options deterministic and reusable. Do not make an option depend on how many times it ran.
- Do not perform I/O, start goroutines, or mutate package globals inside an option.
- Do not use constructor options to mutate an object after publication. Use synchronized methods for intentional live reconfiguration.
- Define ownership for captured pointers, maps, slices, callbacks, and transports. Copy mutable caller data when later caller mutation must not change the object.
- Treat each exported option as supported public API. Do not expose a mutable internal configuration type only to let callers create arbitrary options.

Test the default call, each option, invalid values, meaningful combinations, duplicate and conflicting options, option ordering, and mutable-input ownership. Confirm that failed validation does not start or leak resources.

#### Authority and source boundaries

First-party guidance includes the Go project and Google. Use it for language, compatibility, and general API recommendations:

- The Go team's [module compatibility guidance](https://go.dev/blog/module-compatibility) treats configuration structs and functional options as valid alternatives. It says the choice is largely style, explains exact-function-type breakage and zero-value trade-offs, and requires duplicate-option behavior to be defined.
- [Google's Go variadic-options guidance](https://google.github.io/styleguide/go/best-practices.html#options) gives concrete selection and contract advice. It prefers an options struct when configuration is common, numerous, or shared. It recommends functional options when settings are uncommon, need substantial documentation or validation, or benefit from custom composition. It specifies ordered application, last-wins scalar options, explicit boolean values, and an unexported target type by default.
- The Go team's [Contexts and structs](https://go.dev/blog/context-and-structs) explains why `context.Context` stays an explicit operation parameter.

Go creators and experienced Go leadership provide additional high-value design evidence:

- [Go co-creator Rob Pike's original self-referential options](https://commandcenter.blogspot.com/2014/01/self-referential-functions-and-design.html) return an inverse option for temporary state restoration. This creator source describes a specialized form, not a general constructor requirement.
- [`spf13/viper`](https://github.com/spf13/viper/blob/master/viper.go) is implementation evidence from Steve Francia. Google identified Francia as [Strategy and Product Lead for the Go language and ecosystem](https://cloud.google.com/blog/products/gcp/go-1-18-and-google-cloud-go-now-with-google-cloud), and he [authored articles for the Go team](https://go.dev/blog/go.dev). Viper uses a sealed `Option` interface and applies options sequentially in `NewWithOptions`. Treat that design as experienced Go leadership advice, not as a language specification.

The remaining contract, validation, ownership, and testing rules are conservative engineering synthesis. Go by Example remains a third-party language tutorial. It covers [variadic functions](https://gobyexample.com/variadic-functions) and [closures](https://gobyexample.com/closures), which are the language mechanisms. It does not provide functional-options design guidance.

## Error Handling

### 1. Errors are Values

Errors aren't exceptions to be caught; they are values to be handled. Check them explicitly.

### 2. Wrap for Context, Not for Stack Traces

When returning an error, add context about what you were trying to do.

```go
// Idiomatic
data, err := os.ReadFile(path)
if err != nil {
    return fmt.Errorf("loading config file %s: %w", path, err)
}
```

## Testing Patterns

**Anti-Pattern:** Relying on heavy BDD frameworks (like Ginkgo) or complex mocking generation tools. Go tests should remain ordinary Go code, not a BDD framework or generated-mock-heavy style.

### 1. Testify Assertions in Ordinary Go Tests

Use [Testify](https://github.com/stretchr/testify) `assert` and `require` for clear assertions while keeping standard `testing` functions and `t.Run()` subtests. Use `require` when a failed precondition should stop the case; use `assert` when later independent checks are still useful. Do not use Testify suites or other framework abstractions.

### 2. Short Top-Level Names and Table-Driven Cases

Table-driven subtests are the Go unit-testing standard. Prefer short, behavior-focused top-level test names with many table-driven cases. Do not encode every scenario in the function name: `TestThatThisThingWorksWhenSomethingGoesWrongOneTuesdayInMay` is bad; `TestThingWorks` is preferred. Put scenario details in case names and subtests. Cases should cover different days, months, years, and other meaningful dimensions.

```go
import (
    "testing"
    "time"

    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/require"
)

func TestThingWorks(t *testing.T) {
    tests := []struct {
        name string
        date time.Time
        want string
    }{
        {"Tuesday in May", time.Date(2025, time.May, 6, 0, 0, 0, 0, time.UTC), "Tuesday, May 6, 2025"},
        {"leap day", time.Date(2024, time.February, 29, 0, 0, 0, 0, time.UTC), "Thursday, February 29, 2024"},
        {"new year", time.Date(2023, time.January, 1, 0, 0, 0, 0, time.UTC), "Sunday, January 1, 2023"},
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            got, err := Thing(tt.date)
            require.NoError(t, err)
            assert.Equal(t, tt.want, got)
        })
    }
}
```

### 3. Meaningful Helpers with `t.Helper()`

When extracting repeated assertion logic, always call `t.Helper()` to ensure failures point to the actual test case, not the helper function line.

### 4. Fakes and Stubs over Heavy Mocks

Leverage Go's implicit interfaces to write simple, manual fakes. This keeps test dependencies lightweight and test logic transparent.

### 5. Golden Files and the `testdata` Directory

For tests requiring complex inputs or producing large outputs, use a directory named `testdata`. The `go test` tool explicitly ignores these directories.

### 6. Filesystem Abstraction (The Afero Pattern)

Do not hardcode `os` package calls deep within business logic. Accept an interface for the filesystem so tests can run in memory without touching the disk. `github.com/spf13/afero` is the industry standard for this.

```go
import "github.com/spf13/afero"

type FileProcessor struct {
    fs afero.Fs
}

func NewFileProcessor(fs afero.Fs) *FileProcessor {
    return &FileProcessor{fs: fs}
}
```

In tests, inject `afero.NewMemMapFs()` to completely eliminate disk I/O and prevent flaky, slow tests.

### 7. Testify over `reflect.DeepEqual`

For comparing values, structs, or maps, use Testify assertions such as `assert.Equal` or `require.Equal` instead of `reflect.DeepEqual` for clear failures.

### 8. Modern `testing` Additions (Go 1.24+)

```go
// Test-scoped context — canceled automatically when the test ends.
// Use instead of context.Background() in tests.
func TestFetch(t *testing.T) {
    ctx := t.Context()
    ...
}

// Benchmarks: b.Loop() replaces the classic b.N loop — more accurate,
// prevents the compiler from optimizing the benchmarked call away.
func BenchmarkParse(b *testing.B) {
    for b.Loop() {
        Parse(input)
    }
}

// t.Chdir(dir) changes working directory for the test and restores it after.
```

### 9. `testing/synctest` for Concurrent Code (Go 1.25)

Test goroutines and timeouts deterministically with a fake clock — no `time.Sleep` in tests, no flaky timing assumptions:

```go
func TestTimeout(t *testing.T) {
    synctest.Test(t, func(t *testing.T) {
        ctx, cancel := context.WithTimeout(t.Context(), time.Second)
        defer cancel()
        time.Sleep(2 * time.Second) // instant — fake clock advances when all goroutines block
        if ctx.Err() == nil {
            t.Fatal("expected timeout")
        }
    })
}
```

Never write `time.Sleep(100 * time.Millisecond)` to "wait for a goroutine" in a test. Use synctest, channels, or explicit synchronization.

## Generics (Go 1.18+)

Generics exist to eliminate duplicated algorithms, not to create type hierarchies. If you are thinking about generics in terms of inheritance or polymorphism, stop — you are writing Java.

### When to Use Generics

Use generics when you have the **same algorithm** that needs to operate on **multiple concrete types**:

```go
// Good: generic algorithm, concrete types as inputs
func Map[S, T any](slice []S, f func(S) T) []T {
    result := make([]T, len(slice))
    for i, v := range slice {
        result[i] = f(v)
    }
    return result
}

// Good: constraint expresses a meaningful requirement
func Min[T cmp.Ordered](a, b T) T {
    if a < b {
        return a
    }
    return b
}
```

### When NOT to Use Generics

```go
// Bad: generic interface for polymorphism — this is Java
type Repository[T any] interface {
    Find(id string) (T, error)
    Save(entity T) error
}

// Good: a concrete interface for what you actually need
type UserStore interface {
    FindUser(id string) (*User, error)
    SaveUser(u *User) error
}
```

- **Do not** create generic base types, generic services, or generic repositories.
- **Do not** use `any` as a constraint to mean "I don't know the type yet." That's a design smell.
- **Do** use `comparable` when you need map keys or equality checks.
- **Do** use `cmp.Ordered` when you need `<`, `>`, `<=`, `>=`.
- Start with a concrete implementation. Generify only when you have the same logic repeated across 3+ types.
- Generic type aliases are fully supported since Go 1.24.

## Standard Library: Use the New Packages

LLMs frequently suggest third-party utilities or write manual helpers that have been in the standard library since Go 1.21. **Always check stdlib first.**

### `slices` package (Go 1.21)

```go
import "slices"

// Searching and testing
slices.Contains(s, "value")
slices.Index(s, "value")           // returns -1 if not found
slices.ContainsFunc(s, func(v string) bool { return v == "x" })

// Sorting
slices.Sort(s)                     // sorts in place, works on any ordered type
slices.SortFunc(s, func(a, b T) int { return cmp.Compare(a.Name, b.Name) })
slices.IsSorted(s)

// Manipulation
slices.Reverse(s)
slices.Compact(s)                  // removes consecutive duplicates
slices.Delete(s, i, j)            // removes elements [i, j)
slices.Clone(s)                   // shallow copy
slices.Concat(s1, s2, s3)         // concatenate multiple slices (1.22)

// Iterator bridging (1.23)
slices.Collect(it)                // iterator -> slice
slices.Sorted(it)                 // iterator -> sorted slice
slices.Values(s)                  // slice -> iterator
```

Never write `sort.Slice(s, func(i, j int) bool { return s[i] < s[j] })` when `slices.Sort(s)` exists.

### `maps` package (Go 1.21; iterators 1.23)

```go
import "maps"

maps.Keys(m)        // iterator over keys — collect with slices.Collect / slices.Sorted
maps.Values(m)      // iterator over values
maps.Clone(m)       // shallow copy
maps.Copy(dst, src) // copies all entries from src into dst
maps.DeleteFunc(m, func(k K, v V) bool { ... })  // delete entries matching predicate
maps.Equal(m1, m2)  // reports whether two maps are equal

// Common idiom: sorted keys in one line
keys := slices.Sorted(maps.Keys(m))
```

### `cmp` package (Go 1.21)

```go
import "cmp"

cmp.Compare(a, b)    // returns -1, 0, or 1; works on any cmp.Ordered type
cmp.Or(a, b, c)      // returns first non-zero value — replaces ternary workarounds
min(a, b)            // built-in since Go 1.21
max(a, b)            // built-in since Go 1.21
```

`cmp.Or` is especially useful for default-value patterns:

```go
// Instead of: if cfg.Timeout == 0 { cfg.Timeout = 30 * time.Second }
cfg.Timeout = cmp.Or(cfg.Timeout, 30*time.Second)
```

### `errors.Join` (Go 1.20)

```go
// Combine multiple errors — no third-party library needed
err := errors.Join(err1, err2, err3)

// Works correctly with errors.Is and errors.As
if errors.Is(err, ErrNotFound) { ... }
```

Use this instead of `fmt.Errorf("%w; %w", err1, err2)` or any `multierr` package.

### Iterators: `iter` and Range-over-Func (Go 1.23)

The standard way to expose a sequence from an API without allocating a slice. Return `iter.Seq[T]` or `iter.Seq2[K, V]`; callers use plain `range`:

```go
func (idx *Index) All() iter.Seq[*Person] {
    return func(yield func(*Person) bool) {
        for _, p := range idx.people {
            if !yield(p) {
                return
            }
        }
    }
}

// Caller — just a normal range loop
for p := range idx.All() { ... }
```

Prefer returning iterators over slices for large or lazily-produced sequences. Don't invent a custom `Next()/HasNext()` iterator type — that's Java.

### `math/rand/v2` (Go 1.22)

Always import `math/rand/v2`, never the old `math/rand`. Auto-seeded, cleaner API:

```go
import "math/rand/v2"

rand.IntN(100)            // was rand.Intn — note the capital N
rand.N(10 * time.Second)  // generic: random value in [0, n) for any integer type
```

### `encoding/json`: `omitzero` (Go 1.24)

`omitzero` omits any zero value — including `time.Time{}` and zero structs, which `omitempty` never handled correctly:

```go
type Event struct {
    Name      string    `json:"name"`
    StartedAt time.Time `json:"started_at,omitzero"` // omitempty would emit "0001-01-01T..."
}
```

## Concurrency: Modern Patterns

### `sync/atomic` Typed Values (Go 1.19)

Use the typed atomic values instead of the function-based API:

```go
// Old (still works but avoid for new code)
var count int64
atomic.AddInt64(&count, 1)
val := atomic.LoadInt64(&count)

// New — type-safe, no pointer arithmetic
var count atomic.Int64
count.Add(1)
val := count.Load()

// Other typed atomics
var flag  atomic.Bool
var ptr   atomic.Pointer[MyStruct]
var val32 atomic.Int32
var val64 atomic.Uint64
```

### `context.WithoutCancel` (Go 1.21)

When you need to detach a context's cancellation but preserve its values (e.g., for a background task that should outlive a request):

```go
// The background job should keep running even after the HTTP request context cancels
bgCtx := context.WithoutCancel(requestCtx)
go doBackgroundWork(bgCtx)
```

## HTTP: Use the Improved stdlib Router (Go 1.22)

LLMs reflexively recommend gorilla/mux or chi for any routing beyond the trivial. Since Go 1.22, the standard `net/http` ServeMux handles method and path-parameter routing natively.

```go
mux := http.NewServeMux()

// Method-scoped routes
mux.HandleFunc("GET /users", listUsers)
mux.HandleFunc("POST /users", createUser)

// Path parameters — accessed via r.PathValue
mux.HandleFunc("GET /users/{id}", func(w http.ResponseWriter, r *http.Request) {
    id := r.PathValue("id")
    // ...
})

// Wildcard
mux.HandleFunc("GET /files/{path...}", serveFile)
```

Reach for chi or gorilla/mux only when you need named route generation or regex constraints — middleware doesn't justify a framework (see below). For pure method + path routing, the stdlib is sufficient.

### Production Servers: Always Set Timeouts

`http.ListenAndServe(addr, mux)` ships with **no timeouts** — a single slow client can hold a connection open forever (slow-loris). LLM-generated servers almost never set these. Never emit a production server without them:

```go
srv := &http.Server{
    Addr:              ":8080",
    Handler:           mux,
    ReadHeaderTimeout: 5 * time.Second,   // slow-loris protection
    ReadTimeout:       10 * time.Second,  // full request read
    WriteTimeout:      30 * time.Second,  // response write (covers handler time)
    IdleTimeout:       120 * time.Second, // keep-alive connections
}
```

For per-route control beyond `WriteTimeout`, use `http.TimeoutHandler` or handler-level `context.WithTimeout`. Outbound calls need the same discipline: `http.DefaultClient` has no timeout either — construct a client with one.

### Graceful Shutdown

Every production server needs a shutdown path that stops accepting connections and drains in-flight requests. The pattern:

```go
func run(ctx context.Context) error {
    ctx, stop := signal.NotifyContext(ctx, os.Interrupt, syscall.SIGTERM)
    defer stop()

    srv := &http.Server{ /* ... timeouts as above ... */ }

    errCh := make(chan error, 1)
    go func() { errCh <- srv.ListenAndServe() }()

    select {
    case err := <-errCh:
        return err // ListenAndServe failed at startup
    case <-ctx.Done():
        shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
        defer cancel()
        return srv.Shutdown(shutdownCtx) // drain in-flight, then exit
    }
}
```

- `Shutdown` needs a fresh context with its own deadline — the signal context is already canceled.
- Long-lived connections (SSE, websockets) must watch `r.Context()` or they'll hold shutdown until the drain deadline.

### Middleware Is Just a Function

No framework needed. A middleware is `func(http.Handler) http.Handler`:

```go
func withRequestLog(logger *slog.Logger, next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        start := time.Now()
        next.ServeHTTP(w, r)
        logger.Info("request", "method", r.Method, "path", r.URL.Path, "dur", time.Since(start))
    })
}

// Compose by wrapping — outermost runs first
handler := withRequestLog(logger, withAuth(mux))
```

Don't import a middleware framework for what function composition already does.

## Syntax: Use Current Go

LLMs frequently generate outdated syntax. Know the current idioms:

### Range over Integer (Go 1.22)

```go
// Old
for i := 0; i < 10; i++ { ... }

// New
for i := range 10 { ... }
```

### Build Constraints

```go
// Old (deprecated — do not generate)
// +build linux darwin

// Current
//go:build linux || darwin
```

The `//go:build` form is required since Go 1.17. Never emit the old `// +build` syntax.

### `any` Instead of `interface{}`

```go
// Old
func Print(v interface{}) { ... }

// Current — `any` is a built-in alias for interface{} since Go 1.18
func Print(v any) { ... }
```

### Tool Dependencies in `go.mod` (Go 1.24)

Never generate a `tools.go` file with blank imports. Track dev tools with the `tool` directive:

```bash
go get -tool golang.org/x/tools/cmd/stringer
go tool stringer -type=Color   # run it
```

## Structured Logging with `log/slog` (Go 1.21)

The skill note above covers basic setup. The patterns LLMs most often get wrong:

```go
// Pass a logger via context for request-scoped logging
func HandleRequest(ctx context.Context, r *Request) {
    logger := slog.With("request_id", r.ID, "user_id", r.UserID)
    // All subsequent log calls carry these fields automatically
    logger.Info("handling request")
    process(ctx, logger, r)
}

// Group related fields
logger.With(slog.Group("http",
    slog.String("method", r.Method),
    slog.String("path", r.URL.Path),
    slog.Int("status", status),
))

// Log at the right level — LLMs over-use Info
logger.Debug("cache miss", "key", key)     // internal state, high volume
logger.Info("server started", "addr", addr) // lifecycle events
logger.Warn("retrying", "attempt", n)       // recoverable problems
logger.Error("request failed", "err", err)  // needs attention
```

- **Never** use a package-level `log` or `slog` global beyond `main`. Pass `*slog.Logger` as a dependency.
- **Never** log and return an error. Log at the boundary, return the error through the call stack.
- Use `slog.Default()` as the fallback only in `main` or in libraries when no logger is provided.

## Debugging: The Go Toolchain Is Not the Problem

**The Go tool is extremely reliable. It is almost never the source of a bug.**

When debugging, do not waste time suspecting `go run`, `go build`, `go test`, or the build cache. The Go toolchain does what it says:

- `go run` always recompiles from source. It does not use a stale cached binary.
- `go build` is deterministic and correct.
- `go test` runs the actual compiled test binary.
- The build cache is keyed by source content — if the source changed, the cache is invalidated automatically.

**If an error persists after you edit the code, the explanation is one of these — in order of likelihood:**

1. The edit did not fix the underlying logic error.
2. The edit was made in the wrong file, wrong function, or wrong package.
3. There is a second call site with the same bug that was not updated.
4. The error is coming from a different code path than the one being edited.

**What to do instead of blaming the tool:**

- Re-read the error message carefully. Go's error messages are accurate.
- Confirm the file you edited is actually the file being compiled (`go list -f '{{.GoFiles}}' .`).
- Add a `fmt.Println` or `t.Log` at the exact site to verify execution reaches it.
- Check that all call sites of a changed function were updated.

Do not suggest clearing the build cache (`go clean -cache`), restarting the Go toolchain, or any other tool-level intervention before first exhausting all code-level explanations. The tool is not lying to you.
