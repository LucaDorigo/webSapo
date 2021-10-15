/**
 * @file LinearSystemSet.cpp
 * Represent and manipulate a set of linear systems
 * It can be used to represent a symbolic union of polytopes
 *
 * @author Tommaso Dreossi <tommasodreossi@berkeley.edu>
 * @version 0.1
 */

#include "LinearSystemSet.h"

/**
 * Constructor that instantiates an empty set
 */
LinearSystemSet::LinearSystemSet(): set() {}

/**
 * Constructor that instantiates a singleton set
 *
 * @param[in] LS element of the set
 */
LinearSystemSet::LinearSystemSet(LinearSystem *LS){
	if(!LS->isEmpty()){
		this->set.push_back(LS->simplify());
	}
}

/**
 * Constructor that instantiates a set from a vector of sets
 *
 * @param[in] set vector of linear systems
 */
LinearSystemSet::LinearSystemSet(const vector<LinearSystem*>& set){

	for(int i=0; i<(signed)set.size(); i++){
		if(!set[i]->isEmpty()){
			this->set.push_back(set[i]);
		}
	}
}

/**
 * Get the set of linear systems
 *
 * @returns actual collection of linear systems
 */
const vector<LinearSystem*>& LinearSystemSet::getSet() const {
	return this->set;
}

bool solutionsProvidedByOneLS(const std::vector<LinearSystem*>& S, const LinearSystem &set) {

#if MINIMIZE_LS_SET_REPRESENTATION
	for (std::vector<LinearSystem*>::const_iterator it=std::begin(S); it!=std::end(S); ++it) {
		if ((*it)->solutionsAlsoSatisfy(set)) {
			return true;
		}
	}
#endif

	return false;
}

/**
 * Add a linear system to the set
 *
 * @param[in] LS linear system to add
 */
void LinearSystemSet::add(LinearSystem *LS){
	if(!LS->isEmpty()&&!solutionsProvidedByOneLS(this->set, *LS)){
		this->set.push_back(LS);
	}
}

/**
 * Intersect to sets of linear systems
 *
 * @param[in] LSset set to intersect with
 * @returns intersected sets
 */
LinearSystemSet* LinearSystemSet::intersectWith(const LinearSystemSet *LSset) const {

	LinearSystemSet* result = new LinearSystemSet();
	vector<LinearSystem*> set = LSset->getSet();

	for(int i=0; i<(signed)this->set.size(); i++){
		for(int j=0; j<(signed)set.size(); j++){
			LinearSystem *intLS = this->set[i]->intersectWith(set[j]); // intersect
			result->add(intLS);
		}
	}
	return result;
}

/**
 * Union of sets
 *
 * @param[in] LSset set to union with
 * @returns merged sets
 */
LinearSystemSet* LinearSystemSet::unionWith(LinearSystemSet *LSset){
	LinearSystemSet* result = new LinearSystemSet(this->set);

	for (std::vector<LinearSystem*>::iterator it=std::begin(LSset->set); 
	                                          it!=std::end(LSset->set); ++it) {
		result->add(*it);
	}

	return result;
}

/**
 * Union of two sets of linear systems up to bounded cardinality
 *
 * @param[in] LSset set to union with
 * @param[in] bound set size bound
 * @returns merged sets
 */
LinearSystemSet* LinearSystemSet::boundedUnionWith(LinearSystemSet *LSset, int bound){

	if(this->size() > bound){
		cout<<"LinearSystemSet::boundedUnionWith : size of actual box larger than bound";
		exit (EXIT_FAILURE);
	}

	vector<LinearSystem*> uniSet = this->set; 		// new union set
	vector<LinearSystem*> set = LSset->getSet();
	int set_card = set.size();
	int iters = min(bound-this->size(),set_card);

	for(int i=0; i<iters; i++){
		uniSet.push_back(set[i]);
	}

	return new LinearSystemSet(uniSet);

}

/**
 * Sum of volumes of boxes containing the sets
 *
 * @returns sum of bounding boxes
 */
double LinearSystemSet::boundingVol() const{

	double vol = 0;
	for(int i=0; i<this->size(); i++){
		vol = vol + this->set[i]->volBoundingBox();
	}
	return vol;

}

/**
 * Get the i-th linear system
 *
 * @param[in] index of the linear system to fetch
 * @returns i-th linear system
 */
LinearSystem* LinearSystemSet::at(int i) {
	return this->set[i];
}

/**
 * Get the i-th linear system
 *
 * @param[in] index of the linear system to fetch
 * @returns i-th linear system
 */
const LinearSystem* LinearSystemSet::at(int i) const {
	return this->set[i];
}

/**
 * Check if the current set is empty
 *
 * @returns true if the set is empty
 */
bool LinearSystemSet::isEmpty() const{
	return this->set.empty();
}

/**
 * Print the set of linear systems
 */
void LinearSystemSet::print() const {

	if( this->set.size() <= 0){
		cout<<"--- empty set ----\n";
	}else{
		for(int i=0; i<(signed)this->set.size(); i++){
			cout<<"--------------\n";
			this->set[i]->print();
		}
	}

}

LinearSystemSet::~LinearSystemSet() {
	// TODO Auto-generated destructor stub
}

