/**
 * @file Eventually.h
 * Eventually STL formula
 *
 * @author Tommaso Dreossi <tommasodreossi@berkeley.edu>
 * @version 0.1
 */

#ifndef EVENTUALLY_H_
#define EVENTUALLY_H_

#include "STL.h"

class Eventually : public STL {

private:

	STL * f;			// subformula
	int a, b;			// interval bounds

public:

	Eventually(int a, int b, STL * f);

	inline STL * getSubFormula() { return f; }

	inline int getA() const { return a; }
	inline int getB() const { return b; }

	inline void setA(int a){ this->a = a; }
	inline void setB(int b){ this->b = b; }

	void print() const;

	~Eventually();
};

#endif /* Eventually_H */
