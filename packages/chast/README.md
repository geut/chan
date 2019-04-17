# chast
> Unist compatible spec for changelogs and helpers to nodes creation

## Structure

```idl
interface Root <: Node {
  children: [Preface, Release*]
}
```

```idl
interface Preface <: Node {
  children: [Node]
}
```

```idl
interface Release <: Node {
  identifier: string,
  version: string,
  url: string?
  yanked: boolean?
  unreleased: boolean?
  children: [Action]
}
```

```idl
interface Action <: Node {
  name: string
  children: [Change*, Group*]
}
```

```idl
interface Group <: Node {
  name: string,
  children: [Change]
}
```

```idl
interface Change <: Node {
  children: [Node]
}
```

