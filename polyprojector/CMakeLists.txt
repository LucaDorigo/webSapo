cmake_minimum_required(VERSION 3.7)

project (polyprojector LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 14)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

set(CMAKE_CXX_FLAGS "-O2 -Wall -Wextra -Wpedantic -Werror")

list(APPEND CMAKE_MODULE_PATH "${CMAKE_CURRENT_SOURCE_DIR}/cmake")

find_package(GLPK REQUIRED)
find_package(GMP REQUIRED)
find_package(nlohmann_json REQUIRED)

set(PROJECT_LINK_LIBS ${PROJECT_LINK_LIBS} GMP::gmpxx GMP::gmp GLPK::glpk)

add_executable(polyprojector main.cc)

target_link_libraries(polyprojector ${PROJECT_LINK_LIBS})
