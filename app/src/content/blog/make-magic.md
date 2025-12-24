---
title: 'Makefile Magic: The Quirks That Power Bakes'
description: 'A deep dive into the strange and wonderful Makefile patterns that make Bakes tick'
pubDate: 'Dec 24 2025'
---

If you've used Bakes, you might have wondered: **"How does it do that?"**

How does `make build/api` know which service to build? How do modules auto-download from GitHub? How
can you type `make exec` and land in the right container without thinking about it?

The answer is buried in the beautiful, maddening world of **Makefile quirks**. GNU Make is older than
most frameworks you use daily, and it's full of strange patterns that, once you know them, unlock superpowers.

Let's pull back the curtain and explore the Makefile tricks that make Bakes work.

## Pattern Rules: The `%` Wildcard

This is the foundation of Bakes' multi-service commands.

```makefile
build/%:
	docker compose build $*

exec/%:
	docker compose exec $* sh

logs/%:
	docker compose logs -f $*
```

The `%` acts as a wildcard that matches anything. When you run `make build/api`,
Make matches the pattern `build/%` where `%` = `api`. The special variable `$*` holds that matched text.

**Result:** One pattern rule handles all services. No copy-paste. No hardcoding service names.

**Gotcha:** Pattern rules only work if the target doesn't exist as a file. That's why we mark them as `.PHONY` (more on that later).

## Automatic Variables: The Secret Ingredient

Make has a set of cryptic automatic variables that sound like line noise but are incredibly powerful:

```makefile
# BAKES configuration
export BAKES_REF      ?= main
export BAKES_GIT_URL  ?= https://raw.githubusercontent.com/arthurmartelli/bakes/$(BAKES_REF)

export BAKES_DIR      := infra/.bakes
export BAKES_MAKE_DIR := $(BAKES_DIR)/makefiles
export BAKES_MODULES  := base
export BAKES_FILES    := $(addprefix $(BAKES_MAKE_DIR)/,$(addsuffix .mk,$(BAKES_MODULES)))

$(BAKES_MAKE_DIR)/%.mk:
	@mkdir -p $(dir $@)
	@curl -sSL "$(BAKES_GIT_URL)/makefiles/$(patsubst $(BAKES_MAKE_DIR)/%,%,$@)" -o $@
```

Let's decode this:

- `$@` — The target filename (`infra/.bakes/makefiles/base.mk`)
- `$(dir $@)` — Just the directory part (`infra/.bakes/makefiles/`)
- `$(patsubst $(BAKES_MAKE_DIR)/%,%,$@)` — Strip the prefix, leaving `base.mk`

**What it does:** Downloads Makefile modules from GitHub automatically when you first run `make`. If `base.mk` doesn't exist, this rule triggers, creates the directory, and fetches the file.

**Why it's clever:** No install script needed. Just include the Makefile and everything bootstraps itself.

## The `.PHONY` Directive: Trust Nothing

Here's a problem: what if you have a directory called `build/`? When you run `make build`, Make sees the directory exists and thinks the target is up-to-date. It does nothing.

Solution:

```makefile
.PHONY: build up down exec logs setup clean

build:
	docker compose build
```

`.PHONY` tells Make: "This target is not a file. Always run it."

In Bakes, almost everything is `.PHONY` because we're running commands, not building files.

**Pattern-specific PHONY:**

```makefile
.PHONY: build/% exec/% logs/% up/% down/%

build/%:
	docker compose build $*
```

This marks all pattern-matched targets as PHONY, so `make build/api` always runs even if a `build/api` file exists.

## Double-Colon Rules: Hooks Everywhere

This is how Bakes implements pre/post hooks:

```makefile
build:: pre-build
build::
	@echo "Building Docker images..."
	docker compose build
build:: post-build

pre-build::
post-build::
```

**Double-colon (`::`) rules** let you define the same target multiple times. They all run in order.

In your project Makefile, you can add your own hooks:

```makefile
pre-build::
	@npm audit --audit-level=high

post-build::
	@echo "Build complete! 🎉"
```

**Result:** The Bakes `build` target runs, but your custom pre/post logic executes automatically. No need to override or modify core targets.

## Exporting Variables: Sharing State

Make and shell scripts use different variable systems. Here's the trick to bridge them:

```makefile
export APP_NAME := payment-service
export APP_PORT := 3000

info:
	@echo "App: $$APP_NAME on port $$APP_PORT"
	@echo "COMPOSE_PROJECT_NAME=$$COMPOSE_PROJECT_NAME"
```

**Key points:**

- `export APP_NAME := value` — Makes the variable available to shell commands
- `$$VAR` in recipes — Escapes to shell variable (single `$` is Make variable)
- `$(VAR)` — Make variable expansion
- `:=` vs `=` — `:=` expands immediately, `=` expands lazily

Bakes exports configuration so Docker Compose and scripts can access them:

```makefile
export COMPOSE_PROJECT_NAME := $(APP_NAME)
export COMPOSE_FILE := infra/compose.yaml
```

Now when you run `docker compose`, it automatically picks up these settings.

## Conditional Directives: Smart Defaults

Bakes provides defaults but lets you override them:

```makefile
# Set default if not already defined
APP_NAME ?= my-app
APP_PORT ?= 8080
BAKES_REF ?= main

# Only set if environment variable exists
ifdef VERBOSE
    DOCKER_COMPOSE_FLAGS += --verbose
endif

# Different behavior based on environment
ifeq ($(DRY_RUN),1)
    DOCKER_COMPOSE := echo docker compose
else
    DOCKER_COMPOSE := docker compose
endif
```

**Operators:**

- `?=` — Set only if not already defined
- `ifdef` / `ifndef` — Check if variable exists
- `ifeq` / `ifneq` — Compare values

**Example in Bakes:**

```makefile
ifeq ($(DRY_RUN),1)
build:
	@echo "[DRY RUN] docker compose build"
else
build:
	docker compose build
endif
```

Run with `DRY_RUN=1 make build` to preview without executing.

## Function Calls: String Manipulation Magic

Make has built-in functions for transforming text:

```makefile
export BAKES_MODULES := base docker test
export BAKES_FILES := $(addprefix $(BAKES_MAKE_DIR)/,$(addsuffix .mk,$(BAKES_MODULES)))

# Result: BAKES_FILES = infra/.bakes/makefiles/base.mk infra/.bakes/makefiles/docker.mk infra/.bakes/makefiles/test.mk
```

**Common functions:**

```makefile
# Add prefix/suffix
$(addprefix prefix-,$(ITEMS))
$(addsuffix .txt,$(NAMES))

# Pattern substitution
$(patsubst %.c,%.o,$(SOURCES))  # .c files → .o files

# Filter/filter-out
$(filter %.md,$(FILES))         # Only .md files
$(filter-out test-%,$(TARGETS)) # Exclude test-* targets

# Word manipulation
$(word 2,$(LIST))               # Get 2nd word
$(wordlist 2,4,$(LIST))         # Get words 2-4
$(words $(LIST))                # Count words

# Directory/filename
$(dir /path/to/file.txt)        # → /path/to/
$(notdir /path/to/file.txt)     # → file.txt
$(basename file.txt)            # → file
```

**Real example from Bakes:**

```makefile
# Convert "infra/compose.yaml:infra/compose.local.yaml" to a list
COMPOSE_FILES := $(subst :, ,$(COMPOSE_FILE))

# Check if any compose file is missing
MISSING_FILES := $(foreach file,$(COMPOSE_FILES),$(if $(wildcard $(file)),,$(file)))

ifneq ($(MISSING_FILES),)
    $(error Missing compose files: $(MISSING_FILES))
endif
```

## The `@` Prefix: Silent Commands

By default, Make prints every command before executing it:

```makefile
build:
	docker compose build
# Output:
# docker compose build
# [build output...]
```

Add `@` to suppress the echo:

```makefile
build:
	@echo "Building services..."
	@docker compose build
# Output:
# Building services...
# [build output...]
```

Bakes uses this extensively for cleaner output:

```makefile
setup:
	@echo "🚀 Setting up project..."
	@$(MAKE) build
	@$(MAKE) up
	@echo "✅ Setup complete!"
```

## MAKE vs $(MAKE): Recursive Make

When calling Make from within a Makefile, always use `$(MAKE)`:

```makefile
# ❌ Wrong
setup:
	make build
	make up

# ✅ Correct
setup:
	$(MAKE) build
	$(MAKE) up
```

**Why?** `$(MAKE)` preserves flags like `-j` (parallel builds) and properly handles jobserver tokens. It's the difference between broken parallel builds and smooth execution.

## Multi-Line Commands: The Backslash Dance

Shell commands are line-by-line by default. To create multi-line commands:

```makefile
# Each line is a separate shell
wrong:
	cd /tmp
	pwd  # Still in original directory!

# Backslash continues the line
correct:
	cd /tmp && \
	pwd && \
	ls -la
```

**Bakes pattern:**

```makefile
run:
	docker compose run --rm $(APP_NAME) \
		sh -c "$(CMD)"

# Usage: make run CMD="npm install"
```

## Include Directive: Modular Makefiles

This is how Bakes loads remote modules:

```makefile
# Download files if missing
$(BAKES_FILES):
	# ... download logic ...

# Include them
include $(BAKES_FILES)

# Alternative: Don't error if files are missing
-include $(BAKES_FILES)
```

**The `-` prefix** makes `include` optional (no error if file doesn't exist).

**How Bakes uses it:**

```makefile
# 1. Define what modules you want
export BAKES_MODULES := base docker test

# 2. Generate filenames
export BAKES_FILES := $(addprefix $(BAKES_MAKE_DIR)/,$(addsuffix .mk,$(BAKES_MODULES)))

# 3. Auto-download rule
$(BAKES_MAKE_DIR)/%.mk:
	@mkdir -p $(dir $@)
	@curl -sSL "$(BAKES_GIT_URL)/makefiles/$*.mk" -o $@

# 4. Include them
include $(BAKES_FILES)
```

First time you run `make`, it triggers the download rule, fetches the modules, then includes them. Pure magic.

## Target-Specific Variables: Scoped Configuration

Override variables for specific targets:

```makefile
# Global default
DOCKER_FLAGS := 

# Override for specific target
test: DOCKER_FLAGS := --no-cache
test:
	docker compose build $(DOCKER_FLAGS)

# Another target uses the default (empty DOCKER_FLAGS)
build:
	docker compose build $(DOCKER_FLAGS)
```

**Bakes example:**

```makefile
# Production builds never use cache
build-prod: DOCKER_BUILDKIT := 1
build-prod: DOCKER_FLAGS := --no-cache --pull
build-prod:
	docker compose build $(DOCKER_FLAGS)
```

## Help Target: Self-Documenting Makefiles

This is a popular pattern for auto-generating help from comments:

```makefile
.PHONY: help
help: ## Show this help message
	@echo "Usage: make [target]"
	@echo ""
	@echo "Available targets:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  %-20s %s\n", $$1, $$2}'

setup: ## Build and start all services
	@$(MAKE) build
	@$(MAKE) up

build: ## Build Docker images
	docker compose build

test: ## Run tests
	docker compose run --rm app npm test
```

Run `make help`:

```
Usage: make [target]

Available targets:
  help                 Show this help message
  setup                Build and start all services
  build                Build Docker images
  test                 Run tests
```

Bakes uses this pattern extensively, plus variant targets like `help-build` and `help-vars`.

## Putting It All Together

Here's a real snippet from Bakes that combines multiple quirks:

```makefile
# Variables with defaults
export APP_NAME ?= app
export BAKES_REF ?= main
export BAKES_MODULES := base
export BAKES_FILES := $(addprefix $(BAKES_MAKE_DIR)/,$(addsuffix .mk,$(BAKES_MODULES)))

# Auto-download pattern rule
$(BAKES_MAKE_DIR)/%.mk:
	@mkdir -p $(dir $@)
	@curl -sSL "$(BAKES_GIT_URL)/makefiles/$*.mk" -o $@

# Include modules
include $(BAKES_FILES)

# Pattern rule for service-specific builds
.PHONY: build/%
build/%:
	@echo "Building service: $*"
	@docker compose build $*

# Double-colon for hooks
build:: pre-build
build::
	@echo "Building all services..."
	@docker compose build
build:: post-build

# Default empty hooks
pre-build::
post-build::

# Conditional dry-run mode
ifeq ($(DRY_RUN),1)
    DOCKER_COMPOSE := @echo "[DRY RUN] docker compose"
else
    DOCKER_COMPOSE := @docker compose
endif

# Self-documenting help
help: ## Show available commands
	@grep -E '^[a-zA-Z_/-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  %-20s %s\n", $$1, $$2}'
```

## The Beauty of Make

Make gets a bad rap for being cryptic. But once you learn its quirks, you realize it's an incredibly powerful tool that's been battle-tested for decades.

It's:
- **Fast** — Dependency resolution is instant
- **Portable** — Available everywhere
- **Composable** — Modules, includes, patterns
- **Self-contained** — No runtime dependencies
- **Timeless** — Your Makefiles from 20 years ago still work

That's why Bakes is built on Make. Not Docker Compose CLI plugins, not bash scripts, not a custom tool. Just Make, doing what it's always done best: building things.

## Learn More

Want to dive deeper?

- **GNU Make Manual**: https://www.gnu.org/software/make/manual/
- **Bakes Source Code**: https://github.com/arthurmartelli/bakes
- **Makefile Tutorial**: https://makefiletutorial.com/

**Try it yourself:**

```bash
copier copy gh:arthurmartelli/bakes test-project
cd test-project
cat Makefile  # Read the source
make help     # See what's possible
```

The quirks are features. Embrace them.
