---
title: 'Introducing Bakes: A Makefile Framework for Happier Devs'
description: 'Tired of inconsistent setups in your microservices? Bakes is here to help!'
pubDate: 'Dec 20 2025'
---

It started with a simple question: **"How do I run this one?"**

In a microservice architecture, every repo had its own personality. Some wanted `docker-compose up`,
others preferred a bespoke bash scripts. One used `make run`, another used `make start`, and one
legendary service only worked if you whispered the right environment variables into the terminal.
Onboarding slowed down, docs went stale, and context switching felt _like switching languages every hour_.

We tried guidelines. We tried checklists. We tried "hey, just copy the Makefile from service X."
It sort of worked until it didn't. Updates were scattered, conventions drifted, and the same fixes
got copy-pasted a dozen times. So we did the obvious developer thing: we built a small tool to bake in the basics.

## Meet Bakes

Bakes is a Makefile _"framework"_ / `docker composer` wrapper / project template that gives all your projects
the same core commands _without taking away your flexibility_. It abstracts the common stuff so you can
**type the same commands** in every repo and **get the same results**.

### What You Get

**Standard commands that work everywhere:**

- `make setup` — Build and start all your services
- `make build` — Build Docker images
- `make up` / `make down` — Start and stop containers
- `make exec` — Jump into a shell in your running container
- `make logs` — View service logs
- `make run CMD="..."` — Run one-off commands

**Pattern-based targets for multi-service repos:**

```bash
make build/api     # Build just the API service
make exec/postgres # Shell into the postgres container
make logs/redis    # View Redis logs
make up/worker     # Start only the worker service
```

**Remote module loading** means updates to the framework roll out instantly—no copy-pasting across repos.

**Pre/post hooks** let you customize workflows without forking the core files.

## Before vs After

**Before:**

- "Is it `make run`, `make start`, or that mysterious `./scripts/local.sh`?"
- Every repo has a different layout.
- A small improvement to a common command means touching every service.
- New devs spend hours figuring out how to run each service.

**After:**

- Same muscle memory everywhere: `setup`, `build`, `up`, `exec`.
- Consistent structure so you can find things instantly.
- Updates to shared commands roll out without copy-paste adventures.
- New devs type `make setup` and they're running.

## Getting Started

The fastest way is with Copier, which scaffolds a complete project:

```bash
# Install Copier
pip install copier

# Generate a new project with Bakes built-in
copier copy gh:arthurmartelli/bakes my-new-service
cd my-new-service

# You're ready to go
make setup    # Build and start everything
make logs     # Watch the logs
make exec     # Jump into your app
```

This gives you:

- A multi-stage Dockerfile (dev + prod targets)
- Docker Compose configuration
- A Makefile powered by Bakes
- Sensible `.gitignore` and `.dockerignore` files
- Environment variable templates

## Adding Bakes to an Existing Project

Already have a project? Just drop this into your `Makefile`:

```makefile
export APP_NAME := my-api

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

include $(BAKES_FILES)
```

Now you have access to all the standard commands. Bakes will auto-download the modules when you first run `make`.

## Real-World Example: Extending the Framework

Here's how you keep the standard targets while adding project-specific magic:

```makefile
# Your project Makefile
export APP_NAME := payment-service
export APP_PORT := 3000
export COMPOSE_FILE := infra/compose.yaml

# Include Bakes
include infra/.bakes/makefiles/base.mk

# Add pre-build validation
pre-build:
	@npm audit --audit-level=high

# Auto-run migrations after containers start
post-up:
	$(MAKE) run CMD="npm run migrate"

# Custom target for your team
seed-data:
	$(MAKE) run CMD="npm run seed"

# Run tests in an isolated container
test:
	$(MAKE) run CMD="npm test"
```

Now your workflow looks like:

```bash
make setup     # Builds, validates security, starts containers, runs migrations
make seed-data # Your custom command
make test      # Runs tests in a clean container
make exec      # Jump in to debug
```

The best part? When the Bakes team adds a feature or fixes a bug in the core commands, you get it automatically. No chasing updates across dozens of repos.

## Advanced Features

**Dry-run mode** to preview what will execute:

```bash
DRY_RUN=1 make build
```

**Verbose logging** for debugging:

```bash
VERBOSE=1 make up
```

**Auto-update modules** before building:

```bash
AUTO_UPDATE=1 make build
# Or manually:
make auto-update
```

**Multiple compose files** for different environments:

```makefile
export COMPOSE_FILE := \
  infra/compose.yaml:\
  infra/compose.override.yaml:\
  infra/compose.local.yaml
```

**View all available commands:**.

```bash
make help       # Show all commands
make help-build # Show help for a specific command
make help-vars  # Show all configurable variables
```

## Why It Works

Bakes solves the copy-paste problem with **remote module loading**. Your Makefile pulls the shared logic from a Git repository, so improvements propagate instantly. Pin a specific version for stability:

```makefile
export BAKES_REF := v1.0.0  # Use a tagged release
```

Or stay on the bleeding edge:

```makefile
export BAKES_REF := main    # Always get latest
```

It's **modular**, so you only load what you need:

```makefile
export BAKES_MODULES := base docker test
```

And it's **extensible** through hooks: no need to fork or modify the core files:

```makefile
pre-deploy:
	./scripts/smoke-test.sh

post-deploy:
	./scripts/notify-slack.sh
```

## The Bottom Line

If you're tired of explaining a different build process for every service,
tired of propagating fixes by hand, and tired of watching new devs struggle
through inconsistent setups, then **Bakes is for you**.

Same commands. Every repo. Happy developers.

Check it out on GitHub: <https://github.com/arthurmartelli/bakes>

**Quick Start:**

```bash
copier copy gh:arthurmartelli/bakes my-project
cd my-project
make setup
```

That's it. You're running.
