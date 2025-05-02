# Compiler and flags
CC = gcc
CXX = g++
CFLAGS = -I. -Iinclude -Isodium -Itlsf -Inetcode -Ireliable -Iserialize -fno-rtti -Wall -Wextra -Werror -ffast-math
CXXFLAGS = $(CFLAGS)

# Directories
BINDIR = bin
OBJDIR = obj
SRCDIR = .

# Platform-specific settings
UNAME_S := $(shell uname -s)
ifeq ($(UNAME_S),Linux)
    LIBS = -lsodium
    LIBDIRS = -L/opt/homebrew/lib
else ifeq ($(UNAME_S),Darwin)
    LIBS = -lsodium
    LIBDIRS = -L/opt/homebrew/lib
else
    LIBS = -lsodium-builtin
    LIBDIRS =
endif

# Configuration-specific flags
DEBUG_FLAGS = -g -DYOJIMBO_DEBUG -DNETCODE_DEBUG -DRELIABLE_DEBUG
RELEASE_FLAGS = -O3 -DYOJIMBO_RELEASE -DNETCODE_RELEASE -DRELIABLE_RELEASE

# Source files
SODIUM_SRC = $(wildcard sodium/*.c)
SODIUM_ASM = $(wildcard sodium/*.S)
NETCODE_SRC = netcode/netcode.c
RELIABLE_SRC = reliable/reliable.c
TLSF_SRC = tlsf/tlsf.c
YOJIMBO_SRC = $(wildcard source/*.cpp)
CLIENT_SRC = client.cpp
SERVER_SRC = server.cpp
LOOPBACK_SRC = loopback.cpp
SOAK_SRC = soak.cpp
TEST_SRC = test.cpp

# Object files
SODIUM_OBJ = $(SODIUM_SRC:.c=.o) $(SODIUM_ASM:.S=.o)
NETCODE_OBJ = $(NETCODE_SRC:.c=.o)
RELIABLE_OBJ = $(RELIABLE_SRC:.c=.o)
TLSF_OBJ = $(TLSF_SRC:.c=.o)
YOJIMBO_OBJ = $(YOJIMBO_SRC:.cpp=.o)
CLIENT_OBJ = $(CLIENT_SRC:.cpp=.o)
SERVER_OBJ = $(SERVER_SRC:.cpp=.o)
LOOPBACK_OBJ = $(LOOPBACK_SRC:.cpp=.o)
SOAK_OBJ = $(SOAK_SRC:.cpp=.o)
TEST_OBJ = $(TEST_SRC:.cpp=.o)

# Targets
.PHONY: all clean debug release

all: debug release

debug: CFLAGS += $(DEBUG_FLAGS)
debug: $(BINDIR)/client $(BINDIR)/server $(BINDIR)/loopback $(BINDIR)/soak $(BINDIR)/test

release: CFLAGS += $(RELEASE_FLAGS)
release: $(BINDIR)/client $(BINDIR)/server $(BINDIR)/loopback $(BINDIR)/soak $(BINDIR)/test

# Library rules
$(OBJDIR)/sodium/%.o: sodium/%.c
	@mkdir -p $(@D)
	$(CC) $(CFLAGS) -c $< -o $@ -Wno-unused-parameter -Wno-unused-function -Wno-unknown-pragmas -Wno-unused-variable -Wno-type-limits

$(OBJDIR)/sodium/%.o: sodium/%.S
	@mkdir -p $(@D)
	$(CC) $(CFLAGS) -c $< -o $@

$(OBJDIR)/netcode/%.o: netcode/%.c
	@mkdir -p $(@D)
	$(CC) $(CFLAGS) -DNETCODE_ENABLE_TESTS=1 -c $< -o $@

$(OBJDIR)/reliable/%.o: reliable/%.c
	@mkdir -p $(@D)
	$(CC) $(CFLAGS) -DRELIABLE_ENABLE_TESTS=1 -c $< -o $@

$(OBJDIR)/tlsf/%.o: tlsf/%.c
	@mkdir -p $(@D)
	$(CC) $(CFLAGS) -c $< -o $@

$(OBJDIR)/source/%.o: source/%.cpp
	@mkdir -p $(@D)
	$(CXX) $(CXXFLAGS) -c $< -o $@

# Executable rules
$(BINDIR)/client: $(OBJDIR)/$(CLIENT_OBJ) $(OBJDIR)/yojimbo.a $(OBJDIR)/sodium.a $(OBJDIR)/tlsf.a $(OBJDIR)/netcode.a $(OBJDIR)/reliable.a
	@mkdir -p $(@D)
	$(CXX) $(CXXFLAGS) $< -o $@ $(LIBDIRS) -Lyojimbo -lsodium -ltlsf -lnetcode -lreliable $(LIBS)

$(BINDIR)/server: $(OBJDIR)/$(SERVER_OBJ) $(OBJDIR)/yojimbo.a $(OBJDIR)/sodium.a $(OBJDIR)/tlsf.a $(OBJDIR)/netcode.a $(OBJDIR)/reliable.a
	@mkdir -p $(@D)
	$(CXX) $(CXXFLAGS) $< -o $@ $(LIBDIRS) -Lyojimbo -lsodium -ltlsf -lnetcode -lreliable $(LIBS)

$(BINDIR)/loopback: $(OBJDIR)/$(LOOPBACK_OBJ) $(OBJDIR)/yojimbo.a $(OBJDIR)/sodium.a $(OBJDIR)/tlsf.a $(OBJDIR)/netcode.a $(OBJDIR)/reliable.a
	@mkdir -p $(@D)
	$(CXX) $(CXXFLAGS) $< -o $@ $(LIBDIRS) -Lyojimbo -lsodium -ltlsf -lnetcode -lreliable $(LIBS)

$(BINDIR)/soak: $(OBJDIR)/$(SOAK_OBJ) $(OBJDIR)/yojimbo.a $(OBJDIR)/sodium.a $(OBJDIR)/tlsf.a $(OBJDIR)/netcode.a $(OBJDIR)/reliable.a
	@mkdir -p $(@D)
	$(CXX) $(CXXFLAGS) $< -o $@ $(LIBDIRS) -Lyojimbo -lsodium -ltlsf -lnetcode -lreliable $(LIBS)

$(BINDIR)/test: $(OBJDIR)/$(TEST_OBJ) $(OBJDIR)/yojimbo.a $(OBJDIR)/sodium.a $(OBJDIR)/tlsf.a $(OBJDIR)/netcode.a $(OBJDIR)/reliable.a
	@mkdir -p $(@D)
	$(CXX) $(CXXFLAGS) -DSERIALIZE_ENABLE_TESTS=1 $< -o $@ $(LIBDIRS) -Lyojimbo -lsodium -ltlsf -lnetcode -lreliable $(LIBS)

# Archive rules
$(OBJDIR)/sodium.a: $(SODIUM_OBJ)
	@mkdir -p $(@D)
	ar rcs $@ $^

$(OBJDIR)/netcode.a: $(NETCODE_OBJ)
	@mkdir -p $(@D)
	ar rcs $@ $^

$(OBJDIR)/reliable.a: $(RELIABLE_OBJ)
	@mkdir -p $(@D)
	ar rcs $@ $^

$(OBJDIR)/tlsf.a: $(TLSF_OBJ)
	@mkdir -p $(@D)
	ar rcs $@ $^

$(OBJDIR)/yojimbo.a: $(YOJIMBO_OBJ)
	@mkdir -p $(@D)
	ar rcs $@ $^

# Clean
clean:
	rm -rf $(OBJDIR) $(BINDIR) *.make *.txt *.zip *.tar.gz *.db *.opendb *.vcproj *.vcxproj *.vcxproj.user *.vcxproj.filters *.sln *.xcodeproj *.xcworkspace
	rm -rf ipch .vs Debug Release release cov-int docker/yojimbo valgrind/yojimbo docs xml
	find . -name .DS_Store -delete
