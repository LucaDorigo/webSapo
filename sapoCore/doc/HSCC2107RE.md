# Repeatability Evaluation

## Description

This document explains how to reproduce the results presented in
Section 4 of the submission “Sapo: A Tool for the Reachability Computation and Parameter Synthesis of Polynomial Dynamical Systems” by T. Dreossi.

The elements reproduces by `./bin/sapo` are Tables 1, 2 and Figures 3a, 3b, 4a, 4b of Section 4.
Specifically, the executable reproduces the reachability analysis of Table 1,
the parameter synthesis of Table 2, and generates the scripts `plotFigure3a.m`, `plotFigure3b.m`, `plotFigure4a.m`, and `plotFigure4b.m` that can be used to plot the Figures 3a, 3b, 4a, 4b using Octave or Matlab.

There are two ways to reproduce the data:

1. Using the [Virtual Machine](#virtualmachine)
2. [Building Sapo](#buildsapo) from source

## Test

Virtual machine tested with:

- VirtualBox 5.0.16 on macOS Sierra 10.12.2
- VirtualBox 5.0.32 on OS X El Capitan 10.11.6

Sapo built tested with:

- gcc 5.4.0, clang 8.0.0, cmake >= 3.222, make >= 4.0
- Ubuntu 15.10, Ubuntu 16.04 LTS
- OS X El Capitan 10.11.6, macOS Sierra 10.12.3

# Repeatability Instructions

## <a name="virtualmachine">Virtual Machine</a>

To use the virtual machine, the following packages are required:

- <a href="https://www.virtualbox.org/wiki/VirtualBox">VirtualBox</a>

To reproduce the experiments:

1. Download the VM <a href="https://www.dropbox.com/sh/4ex9yqc3y0p1618/AACnl43b9knKovYaHVTwlkxVa?dl=0">here</a>
2. Untar and launch the VM using <a href="https://www.virtualbox.org/wiki/VirtualBox">VirtualBox</a> (if VirtualBox complains, disable the USB port: right-click on the VM, Settings, Ports, USB, Enable USB controller)
3. Login with usersame `sapo` and password `sapo`
4. To reproduce the case studies:

```sh
cd ~/sapo/bin
./sapo
```

To visualize the figures go to the [Visualize Figures](#visfigs) section.

## <a name="buildsapo">Build Sapo</a>

To compile the source code, the following packages are required:

- C++11-compatible compiler, <a href="https://cmake.org/">cmake</a>, <a href="https://www.gnu.org/software/make/">make</a>, <a href="https://www.freedesktop.org/wiki/Software/pkg-config/">pkg-config</a>
- <a href="http://www.ginac.de/CLN/">CLN</a>, <a href="http://www.ginac.de/">GiNaC</a>, <a href="https://www.gnu.org/software/glpk/">GLPK</a> libraries

### Install CLN

Download latest <a href="http://www.ginac.de/CLN/">CLN</a> and install:

```sh
curl http://www.ginac.de/CLN/cln-1.3.4.tar.bz2 | tar -xj;
cd cln-1.3.4/;
./configure;
make;
make check;
sudo make install;
```

### Install GiNaC

Download latest <a href="http://www.ginac.de/">GiNaC</a> and install:

```sh
curl http://www.ginac.de/ginac-1.7.2.tar.bz2 | tar -xj;
cd ginac-1.7.2/;
./configure;
make;
make check;
sudo make install;
```

### Install GLPK

Download latest <a href="https://www.gnu.org/software/glpk/">GLPK</a> and install:

```sh
curl http://ftp.gnu.org/gnu/glpk/glpk-4.61.tar.gz | tar -xz;
cd glpk-4.61/;
./configure;
make;
make check;
sudo make install;
```

### Install Sapo

Once that the required packages are installed, download, build and install Sapo:

```sh
git clone https://github.com/tommasodreossi/sapo
cd sapo
cmake .
make
```

This generates the executable `./bin/sapo`.
To reproduce the case studies:

```sh
cd bin
./sapo
```

To visualize the figures go to the [Visualize Figures](#visfigs) section.

## <a name="visfigs">Visualize Figures</a>

The executable `./bin/sapo` produces the scripts
`plotFigure3a.m`, `plotFigure3b.m`, `plotFigure4a.m`, and`plotFigure4b.m` that can be used to generate the figures
of the paper. The scripts can be run in both Octave and Matlab
and require the `plotregion` package available
<a href="https://www.mathworks.com/matlabcentral/fileexchange/9261-plot-2d-3d-region">here</a> (MatWorks account required) or <a href="https://www.dropbox.com/sh/4ex9yqc3y0p1618/AACnl43b9knKovYaHVTwlkxVa?dl=0">here</a>.

For instance, from the virtual machine, launch Octave:

```sh
octave
```

and then from Octave command window, include the `plotregion` package and run the scripts. For instance:

```sh
cd ~/sapo/bin
addpath("~/Downloads")
figure(1); plotFigure3a;
figure(2); plotFigure3b;
figure(3); plotFigure4a;
figure(4); plotFigure4b;
```

Notes:

1. The scripts might take some time (around 20 seconds) to plot the reachable sets
2. Depending on Matlab or Octave, the color of the plots might differ from those from the paper

# Experiments Overview

The experiments run by the executable `./bin/sapo` can be overviewed in the source `./src/main.cpp`.
The main file is structured in four main sections: Table 1, Table 2, Figure 3 and Figure 4.

In the first part (lines 39-58), the models listed in Table 1 are instantiated and for each model Sapo's reachability function `sapo->reach`
is invoked (line 56).

In the second part (lines 61-76), the parametric models (together with their specifications) listed in Table 2 are instantiated and for each model Sapo's parameter synthesis function `sapo->synthesize` is invoked (line 74).

In the third part (lines 103-123) a SIR model with a box template is instantiated (line 80) and its reach set is computed (line 85) and printed in a `.m` script (lines 87-100). Similarly, a SIR model with a bundle template is instantiated (line 104) and its reach set is computed (line 109) and printed in a `.m` script (lines 112-123).

Finally, in the fourth part (lines 126-167) a parametric SIR model is instantiated (line 127) and valid parameters are synthesized (line 132). The computed parameter set and the original one are printed in a script (lines 136-145). Also, the reachable set under the synthesized parameter set is computed (line 153) and plotted in a script (lines 156-167).

The models dynamics, reachability set templates, and specification can be found in the model classes in `./src/models/*.cpp`.
For more implementation details, please refer to <a href="https://people.eecs.berkeley.edu/~tommasodreossi/papers/phd_thesis.pdf">Reachability Computation and Parameter Synthesis for Polynomial Dynamical Systems</a> by T. Dreossi.
