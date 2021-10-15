/**
 * @file Sapo.cpp
 * Core of Sapo tool.
 * Here the reachable set and the parameter synthesis are done.
 *
 * @author Tommaso Dreossi <tommasodreossi@berkeley.edu>
 * @version 0.1
 */

#include "Sapo.h"

/**
 * Constructor that instantiates Sapo
 *
 * @param[in] model model to analyize
 * @param[in] sapo_opt options to tune sapo
 */
Sapo::Sapo(Model *model, sapo_opt options) {
	this->vars = model->getVars();
	this->params = model->getParams();
	this->dyns = model->getDyns();
	this->options = options;
}

/**
 * Reachable set computation
 *
 * @param[in] initSet bundle with the initial set
 * @param[in] k time horizon
 * @returns flowpipe of bundles
 */
Flowpipe* Sapo::reach(Bundle* initSet, int k){
	
	map< vector<int>,pair<lst,lst> > controlPts;

	Flowpipe *flowpipe = new Flowpipe();

	if(this->options.verbose){
		initSet->getBundle()->print();
	}
	flowpipe->append(initSet);

	cout<<"Computing reach set..."<<flush;

	for(int i=0; i<k; i++){

		//cout<<"Reach step "<<i<<"\n";

		Bundle *X = flowpipe->get(i);	// get actual set
		X = X->transform(this->vars,this->dyns,controlPts,this->options.trans);	// transform it

		if(this->options.decomp > 0){	// eventually decompose it
			X = X->decompose(this->options.alpha,this->options.decomp);
		}
		if(this->options.verbose){
			X->getBundle()->print();
		}

		flowpipe->append(X);			// store result
	}
	cout << "done" << endl;

	return flowpipe;
}

/**
 * Reachable set computation for parameteric dynamical systems
 *
 * @param[in] initSet bundle with the initial set
 * @param[in] paraSet set of parameters
 * @param[in] k time horizon
 * @returns flowpipe of bundles
 */
Flowpipe* Sapo::reach(Bundle* initSet, LinearSystem* paraSet, int k){

	map< vector<int>,pair<lst,lst> > controlPts; 

	paraSet->simplify();
	
	Flowpipe *flowpipe = new Flowpipe();

	cout<<"Computing parametric reach set..."<<flush;

	if(this->options.verbose){
		initSet->getBundle()->print();
	}
	flowpipe->append(initSet);


	for(int i=0; i<k; i++){

		//cout<<"Reach step "<<i<<"\n";

		Bundle *X = flowpipe->get(i);	// get actual set
		X = X->transform(this->vars,this->params, this->dyns, paraSet, controlPts, this->options.trans);	// transform it

		if(this->options.decomp > 0){	// eventually decompose it
			X = X->decompose(this->options.alpha,this->options.decomp);
		}

		if(this->options.verbose){
			X->getBundle()->print();
		}

		flowpipe->append(X);			// store result
	}

	cout << "done" << endl;

	return flowpipe;

}

/**
 * Parameter synthesis procedure
 *
 * @param[in] reachSet bundle with the initial set
 * @param[in] parameterSet set of sets of parameters
 * @param[in] formula STL contraint to impose over the model
 * @returns refined sets of parameters
 */
LinearSystemSet* Sapo::synthesize(Bundle *reachSet, LinearSystemSet *parameterSet, STL *formula){

	cout<<"Synthesizing parameters..."<<flush;

	LinearSystemSet *res = this->synthesizeSTL(reachSet,parameterSet,formula);
	cout << "done" << endl;

	return res;
}

/**
 * Internal parameter synthesis procedure
 *
 * @param[in] reachSet bundle with the initial set
 * @param[in] parameterSet set of sets of parameters
 * @param[in] formula STL contraint to impose over the model
 * @returns refined sets of parameters
 */
LinearSystemSet* Sapo::synthesizeSTL(Bundle *reachSet, LinearSystemSet *parameterSet, STL *formula){
	
	//reachSet->getBundle()->plotRegion();

	switch( formula->getType() ){

		// Atomic predicate
		case 0:
			return this->refineParameters(reachSet, parameterSet, (const Atom *)formula);
		break;

		// Conjunction
		case 1:{
			Conjunction *conj = (Conjunction *) formula;
			LinearSystemSet *LS1 = this->synthesizeSTL(reachSet, parameterSet, conj->getLeftSubFormula());
			LinearSystemSet *LS2 = this->synthesizeSTL(reachSet, parameterSet, conj->getRightSubFormula());
			return LS1->intersectWith(LS2);
		}
		break;

		// Disjunction
		case 2:{
			Disjunction *disj = (Disjunction *) formula;
			LinearSystemSet *LS1 = this->synthesizeSTL(reachSet, parameterSet, disj->getLeftSubFormula());
			LinearSystemSet *LS2 = this->synthesizeSTL(reachSet, parameterSet, disj->getRightSubFormula());
			return LS1->unionWith(LS2);
		}
		break;

		// Until
		case 3:
			return this->synthesizeUntil(reachSet, parameterSet, (Until *)formula);
		break;

		// Always
		case 4:
			return this->synthesizeAlways(reachSet, parameterSet, (Always *)formula);
		break;

		// Eventually
		case 5:
			Atom *a = new Atom(-1);
			Eventually *ev = (Eventually *)formula;

			Until *u = new Until(a, ev->getA(), ev->getB(), ev->getSubFormula());
			return this->synthesizeUntil(reachSet, parameterSet, u);
			//return this->synthesizeEventually(base_v, lenghts, parameterSet, formula);
		break;

	}

	return parameterSet;

}

/**
 * Parameter synthesis w.r.t. an atomic formula
 *
 * @param[in] reachSet bundle with the initial set
 * @param[in] parameterSet set of sets of parameters
 * @param[in] sigma STL atomic formula
 * @returns refined sets of parameters
 */
LinearSystemSet* Sapo::refineParameters(Bundle *reachSet, LinearSystemSet *parameterSet, const Atom *atom){

	LinearSystemSet *result = new LinearSystemSet();

	for(int i=0; i<reachSet->getCard(); i++){	// for each parallelotope

		// complete the key
		vector<int> key = reachSet->getTemplate(i);
		key.push_back(atom->getID());

		Parallelotope *P = reachSet->getParallelotope(i);
		lst genFun = P->getGeneratorFunction();
		lst controlPts;

		if(this->synthControlPts.count(key) == 0 || (!this->synthControlPts[key].first.is_equal(genFun))){
			// compose f(gamma(x))
			lst sub, fog;
			for(int j=0; j<this->vars.nops(); j++){
				sub.append(vars[j] == genFun[j]);
			}
			for(int j=0; j<(signed)vars.nops(); j++){
				fog.append(this->dyns[j].subs(sub));
			}

			// compose sigma(f(gamma(x)))
			lst sub_sigma;
			for(int j=0; j<this->vars.nops(); j++){
				sub_sigma.append(vars[j] == fog[j]);
			}
			ex sofog;
			sofog = atom->getPredicate().subs(sub_sigma);

			// compute the Bernstein control points
			BaseConverter *bc = new BaseConverter(P->getAlpha(),sofog);
			controlPts = bc->getBernCoeffsMatrix();
			this->synthControlPts[key].first = genFun;
			this->synthControlPts[key].second = controlPts;

		}else{
			controlPts = this->synthControlPts[key].second;
		}

		// substitute numerical values in sofog
		vector< double > base_vertex = P->getBaseVertex();
		vector< double > lengths = P->getLenghts();

		lst qvars = P->getQ();
		lst bvars = P->getBeta();
		lst para_sub;
		for(int j=0; j<this->vars.nops(); j++){
			para_sub.append(qvars[j] == base_vertex[j]);
			para_sub.append(bvars[j] == lengths[j]);
		}
		ex num_sofog;
		lst synth_controlPts;
		//for(int j=0; j<controlPts.nops(); j++){
		for (lst::const_iterator j = controlPts.begin(); j != controlPts.end(); ++j){
			synth_controlPts.append((*j).subs(para_sub));
		}

		//cout<<synth_controlPts;

		LinearSystem *num_constraintLS = new LinearSystem(this->params, synth_controlPts);
		LinearSystemSet *controlPtsLS = new LinearSystemSet(num_constraintLS);
		result = result->unionWith(parameterSet->intersectWith(controlPtsLS));
	}

	return result;

}

/**
 * Parameter synthesis w.r.t. an until formula
 *
 * @param[in] reachSet bundle with the initial set
 * @param[in] parameterSet set of sets of parameters
 * @param[in] sigma STL until formula
 * @returns refined sets of parameters
 */
LinearSystemSet* Sapo::synthesizeUntil(Bundle *reachSet, LinearSystemSet *parameterSet, Until *formula){

	LinearSystemSet* result = new LinearSystemSet();
	// get formula temporal interval
	int a = formula->getA();
	int b = formula->getB();

	// Until interval far
	if((a > 0) && (b > 0)){
		// Synthesize wrt phi1
		LinearSystemSet *P1 = this->synthesizeSTL(reachSet, parameterSet, formula->getLeftSubFormula());
		if( P1->isEmpty() ){
			return P1;			// false until
		}else{
			// shift until interval
			formula->setA(a-1);
			formula->setB(b-1);

			// Reach step wrt to the i-th linear system of P1
			for(int i=0; i<P1->size(); i++){
				// TODO : add the decomposition
				Bundle *newReachSet = reachSet->transform(this->vars,this->params,this->dyns,P1->at(i), this->reachControlPts, this->options.trans);
				
				LinearSystemSet* tmpLSset = new LinearSystemSet(P1->at(i));
				tmpLSset = synthesizeUntil(newReachSet, tmpLSset, formula);
				result = result->unionWith(tmpLSset);
			}
			return result;
		}
	}

	// Inside until interval
	if((a == 0) && (b > 0)){
		// Refine wrt phi1 and phi2
		LinearSystemSet *P1 = this->synthesizeSTL(reachSet, parameterSet, formula->getLeftSubFormula());
		LinearSystemSet *P2 = this->synthesizeSTL(reachSet, parameterSet, formula->getRightSubFormula());

		if( P1->isEmpty() ){
			return P2;
		}

		// shift until interval
		formula->setB(b-1);
		for(int i=0; i<P1->size(); i++){
		// 	TODO : add decomposition
			Bundle *newReachSet = reachSet->transform(this->vars,this->params,this->dyns,P1->at(i), this->reachControlPts, this->options.trans);
			LinearSystemSet* tmpLSset = new LinearSystemSet(P1->at(i));
			tmpLSset = synthesizeUntil(newReachSet, tmpLSset, formula);
			result = result->unionWith(tmpLSset);
		}
		return P2->unionWith(result);
	}

	// Base case
	if((a == 0) && (b == 0)){
		return this->synthesizeSTL(reachSet, parameterSet, formula->getRightSubFormula());
	}

	return result;

}

/**
 * Parameter synthesis w.r.t. an always formula
 *
 * @param[in] reachSet bundle with the initial set
 * @param[in] parameterSet set of sets of parameters
 * @param[in] sigma STL always formula
 * @returns refined sets of parameters
 */
LinearSystemSet* Sapo::synthesizeAlways(Bundle *reachSet, LinearSystemSet *parameterSet, Always *formula){

	//reachSet->getBundle()->plotRegion();

	LinearSystemSet* result = new LinearSystemSet();
	int a = formula->getA();
	int b = formula->getB();

	// Always interval far
	if((a > 0) && (b > 0)){

		// shift always interval
		formula->setA(a-1);
		formula->setB(b-1);

		// Reach step wrt to the i-th linear system of parameterSet
		for(int i=0; i<parameterSet->size(); i++){
			Bundle *newReachSet = reachSet->transform(this->vars,this->params,this->dyns,parameterSet->at(i), this->reachControlPts, options.trans);
			LinearSystemSet* tmpLSset = new LinearSystemSet(parameterSet->at(i));
			tmpLSset = synthesizeAlways(newReachSet, tmpLSset, formula);
			result = result->unionWith(tmpLSset);
		}
		return result;
	}

	// Inside Always interval
	if((a == 0) && (b > 0)){

		// Refine wrt phi
		LinearSystemSet *P = this->synthesizeSTL(reachSet, parameterSet, formula->getSubFormula());

		if(!P->isEmpty()){

			// shift until interval
			formula->setB(b-1);

			// Reach step wrt to the i-th linear system of P
			for(int i=0; i<P->size(); i++){
				Bundle *newReachSet = reachSet->transform(this->vars,this->params,this->dyns,P->at(i), this->reachControlPts, options.trans);
				LinearSystemSet* tmpLSset = new LinearSystemSet(P->at(i));
				tmpLSset = synthesizeAlways(newReachSet, tmpLSset, formula);
				result = result->unionWith(tmpLSset);
			}

			return result;
		}

		return P;

	}

	// Base case
	if((a == 0) && (b == 0)){
		return this->synthesizeSTL(reachSet, parameterSet, formula->getSubFormula());
	}

	return result;
}


Sapo::~Sapo() {
	// TODO Auto-generated destructor stub
}
