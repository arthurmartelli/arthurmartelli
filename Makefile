export APP_NAME := website
export CLEAN_FILES := app/{node_modules,dist,.astro}

# BAKES configuration
export BAKES_REF      ?= main
export BAKES_GIT_URL  ?= https://raw.githubusercontent.com/arthurmartelli/bakes/$(BAKES_REF)

export BAKES_DIR      := infra/.bakes
export BAKES_MAKE_DIR := $(BAKES_DIR)/makefiles
export BAKES_MODULES  := base
export BAKES_FILES    := $(addprefix $(BAKES_MAKE_DIR)/,$(addsuffix .mk,$(BAKES_MODULES)))

$(BAKES_MAKE_DIR)/%.mk:
	@mkdir -p $(dir $@)
	@curl -sSL "$(BAKES_GIT_URL)/makefiles/$(notdir $@)" -o $@

include $(BAKES_FILES)

post-build install:
	$(MAKE) run CMD="npm ci"
