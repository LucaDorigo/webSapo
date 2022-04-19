#include <iostream>
#include <vector>
#include <set>
#include <iterator>

#include <glpk.h>
#include <limits>
#include <cmath>

#include <nlohmann/json.hpp>

using json = nlohmann::json;


template<typename T>
std::ostream& operator<<(std::ostream& out, const std::vector<T> &v)
{
    auto v_it = std::begin(v);

    out << "[" << *v_it;
    ++v_it;
    for (;v_it != std::end(v); ++v_it) {
        out << "," << *v_it;
    }

    out << "]";

    return out;
}

template<typename T>
class LinearSystem
{
    std::vector<std::vector<T>> directions;
    std::vector<T> upper_bounds;
public:
    LinearSystem() 
    {}
    
    LinearSystem(const std::vector<std::vector<T>> &directions,
                    const std::vector<T> &upper_bounds):
                    directions(directions),
                    upper_bounds(upper_bounds)
    {
        if (directions.size() != upper_bounds.size()) {
            throw std::domain_error("directions and upper_bounds must have the same size");
        }
    }
    
    LinearSystem(std::vector<std::vector<T>> &&directions,
                    std::vector<T> &&upper_bounds):
                    directions(std::move(directions)),
                    upper_bounds(std::move(upper_bounds))
    {
        if (directions.size() != upper_bounds.size()) {
            throw std::domain_error("directions and upper_bounds must have the same size");
        }
    }

    const std::vector<std::vector<T>> &A() const
    {
        return directions;
    }

    const std::vector<T> &b() const
    {
        return upper_bounds;
    }

    size_t size() const 
    {
        return directions.size();
    }

    size_t num_of_columns() const
    {
        return (size()==0 ? 0 : directions.front().size());
    }

    LinearSystem<T> &push_back(const std::vector<T>& direction, const T &upper_bound)
    {
        directions.push_back(direction);
        upper_bounds.push_back(upper_bound);

        return *this;
    }

    LinearSystem<T> &pop_back()
    {
        directions.pop_back();
        upper_bounds.pop_back();

        return *this;
    }

    template<typename E>
    friend std::ostream &operator<<(std::ostream& out, const LinearSystem<E> &lsystem)
    {
        for (unsigned int i=0; i<lsystem.directions.size(); ++i) {
            if (i>0) {
                out << std::endl;
            }
            for (const E &value: lsystem.directions[i]) {
                out << value << " ";
            }

            out << "<= " << lsystem.upper_bounds[i];
        }

        return out;
    }
};

typedef struct
{
    std::vector<double> optimizer;
    int status;
} OptimizationResult;

OptimizationResult optimize(const LinearSystem<double> &constraints, 
                             const std::vector<double> &direction, 
                             const int opt_type)
{
  unsigned int num_rows = constraints.size();
  unsigned int num_cols = direction.size();
  unsigned int size_lp = num_rows * num_cols;

  int *ia, *ja;
  double *ar;

  ia = (int *)calloc(size_lp + 1, sizeof(int));
  ja = (int *)calloc(size_lp + 1, sizeof(int));
  ar = (double *)calloc(size_lp + 1, sizeof(double));

  glp_prob *lp;
  lp = glp_create_prob();
  glp_set_obj_dir(lp, opt_type);

  // Turn off verbose mode
  glp_smcp lp_param;
  glp_init_smcp(&lp_param);
  lp_param.msg_lev = GLP_MSG_ERR;

  glp_add_rows(lp, num_rows);
  for (unsigned int i = 0; i < num_rows; i++) {
    glp_set_row_bnds(lp, i + 1, GLP_UP, 0.0, constraints.b()[i]);
  }

  glp_add_cols(lp, num_cols);
  for (unsigned int i = 0; i < num_cols; i++) {
    glp_set_col_bnds(lp, i + 1, GLP_FR, 0.0, 0.0);
  }

  for (unsigned int i = 0; i < num_cols; i++) {
    glp_set_obj_coef(lp, i + 1, direction[i]);
  }

  unsigned int k = 1;
  for (unsigned int i = 0; i < num_rows; i++) {
    for (unsigned int j = 0; j < num_cols; j++) {
      ia[k] = i + 1;
      ja[k] = j + 1;
      ar[k] = constraints.A()[i][j]; /* a[i+1,j+1] = A[i][j] */
      k++;
    }
  }

  glp_load_matrix(lp, size_lp, ia, ja, ar);
  glp_exact(lp, &lp_param);
  //	glp_simplex(lp, &lp_param);

  OptimizationResult res{std::vector<double>(num_cols), glp_get_status(lp)};
  for (unsigned int i=0; i<num_cols; ++i) {
      res.optimizer[i] = glp_get_col_prim(lp, i+1);
  }

  glp_delete_prob(lp);
  glp_free_env();
  free(ia);
  free(ja);
  free(ar);

  return res;
}

template<typename T>
bool operator==(const std::vector<T> &v1, const std::vector<T> &v2)
{
    if (v1.size() != v2.size()) {
        return false;
    }

    for (unsigned int i=0; i<v1.size(); ++i) {
        if (abs(v1[i]-v2[i])>std::numeric_limits<double>::min()) {
            return false;
        }
    }
    return true;
}

template<typename T>
inline bool operator!=(const std::vector<T> &v1, const std::vector<T> &v2)
{
    return !(v1==v2);
}

template<typename T>
std::vector<T> operator-(const std::vector<T> &v1, const std::vector<T> &v2)
{
    if (v1.size() != v2.size()) {
        throw std::domain_error("The two vectors must have the same size");
    }

    std::vector<T> res;
    res.reserve(v1.size());

    for (unsigned int i=0; i<v1.size(); ++i) {
        res.push_back(v1[i]-v2[i]);
    }
    return res;
}

template<typename T>
T operator*(const std::vector<T> &v1, const std::vector<T> &v2)
{
    if (v1.size() != v2.size()) {
        throw std::domain_error("The two vectors must have the same size");
    }

    T res = 1;

    for (unsigned int i=0; i<v1.size(); ++i) {
        res *= v1[i]*v2[i];
    }
    return res;
}

template<typename T>
T norm1(const std::vector<T> &v)
{
    T max_value = std::numeric_limits<T>::lowest();
    for (unsigned int i=0; i<v.size(); ++i) {
        if (abs(v)>max_value) {
            max_value = abs(v);
        }
    }
    return max_value;
}


template<typename T>
std::vector<T> operator-(const std::vector<T> &v)
{
    std::vector<T> ng(v);
    for (auto v_it = std::begin(ng); v_it != std::end(ng); ++v_it) {
        *v_it = -*v_it;
    }
    return ng;
}

template <typename T>
using Point = std::vector<T>;

template<typename T>
Point<T> project(const Point<T>& p, const std::vector<unsigned int> &axis_vector)
{
    Point<T> pp;
    
    pp.reserve(axis_vector.size());

    for (const unsigned int &axis: axis_vector) {
        pp.push_back(p[axis]);
    }
    return pp;
}

template<typename T>
Point<T> extend(const Point<T>& p, const std::vector<unsigned int> &axis_vector,
                const unsigned int extended_size)
{
    if (p.size()!= axis_vector.size()) {
        throw std::domain_error("p and axis_vector must have the same size");
    }

    Point<T> pp(extended_size, 0);
    for (unsigned int i=0; i<axis_vector.size(); ++i) {
        pp[axis_vector[i]] = p[i];
    }

    return pp;
}

inline 
OptimizationResult optimize(const LinearSystem<double> &constraints, 
                             const std::vector<double> &direction,
                             const std::vector<unsigned int> &axis_vector,
                             const int opt_type)
{
    OptimizationResult res = optimize(constraints, direction, opt_type);
    res.optimizer = project(res.optimizer, axis_vector);
    return res;
}

template<typename T>
std::vector<Point<T>> find_min_max_points(const LinearSystem<T> &constraints, 
                                          const std::vector<T> &direction,
                                          const std::vector<unsigned int> &axis_vector)
{
    std::vector<Point<T>> points;
 
    OptimizationResult res = optimize(constraints, direction, axis_vector, GLP_MAX);

    if (res.status==GLP_OPT) {
        points.push_back(res.optimizer);
    }
    res = optimize(constraints, direction, axis_vector, GLP_MIN);

    if (res.status==GLP_OPT && res.optimizer != points[0]) {
        points.push_back(res.optimizer);
    }

    return points;
}

template<typename T>
std::vector<T> get_an_orthogonal(const std::vector<T>& v)
{
    std::cout<< "get_an_orthogonal "  << v << std::endl << std::flush;
    for (unsigned int i=0; i<v.size(); ++i) {
        if (v[i]!=0) {
			unsigned int next_idx = (i+1)%v.size();
            std::cout<< "vvvvv "  << v << " " << next_idx << std::endl << std::flush;
            std::vector<T> orth(v);
            

            orth[i]=v[next_idx];
			orth[next_idx]=-v[i];

            return orth;
        }
    }

    throw std::domain_error("No orthogonal vector to null vector");
}

namespace Space3D
{

template<typename T>
std::vector<T> cross(const std::vector<T> &v1, const std::vector<T> &v2)
{
    if (v1.size() != v2.size()) {
        throw std::domain_error("The two vectors must have the same size");
    }

    if (v1.size() != 3) {
        throw std::domain_error("Cross product supported only for dimension 3");
    }

    return std::vector<T>{v1[1]*v2[2]-v1[2]*v2[1],
                          v1[2]*v2[0]-v1[0]*v2[2],
                          v1[0]*v2[1]-v1[1]*v2[0]};
}

template<typename T>
class Plan
{
    std::vector<T> _coeffs;
    T _const;

public:
    Plan(const T& coeff1, const T& coeff2, const T& coeff3):
        _coeffs{coeff1, coeff2, coeff3}, _const(0)
    {}

    Plan(const T& coeff1, const T& coeff2, const T& coeff3, const T& constant):
        _coeffs{coeff1, coeff2, coeff3}, _const(constant)
    {}

    Plan(const Point<T> &p1, const Point<T> &p2, const Point<T> &p3)
    {
        _coeffs = std::move(cross(p2-p1, p3-p1));
        _const = _coeffs * p1;
    }

    const std::vector<T> &get_coeffs() const
    {
        return _coeffs;
    }

    const T &get_const() const
    {
        return _const;
    }
};

template<typename T>
class Simplex
{
    std::vector<std::vector<T>> _directions;
    std::vector<Point<T>> _vertices;
    bool _singular;
public:

    Simplex(const std::vector<std::vector<T>> &directions, 
            const std::vector<Point<T>> &vertices,
            const bool singular):
        _directions(directions), _vertices(vertices), _singular(singular)
    {
    }

    Simplex(std::vector<std::vector<T>> &&directions, 
            std::vector<Point<T>> &&vertices,
            bool singular):
        _directions(std::move(directions)), _vertices(std::move(vertices)), 
        _singular(singular)
    {
    }

    Simplex(std::vector<std::vector<T>> &&directions, 
        std::set<Point<T>> &&vertices,
        bool singular):
    _directions(std::move(directions)), _vertices(vertices.size()), 
    _singular(singular)
    {
        auto v_it = std::begin(_vertices);
        for (auto s_it = std::begin(vertices); s_it != std::end(vertices); ++s_it, ++v_it) {
            *v_it = *s_it;
        }
    }

    bool is_singular() const
    {
        return _singular;
    }

    const std::vector<T> &get_last_direction() const
    {
        return _directions.back();
    }

    const std::vector<Point<T>> &get_vertices() const
    {
        return _vertices;
    }
};

}

template<typename T>
Space3D::Simplex<T> get_initial_3D_simplex(const LinearSystem<T>& constraints,
                                           const std::vector<unsigned int> &axis_vector)
{
    using namespace Space3D;

    std::vector<std::vector<T>> directions;
    std::vector<T> direction(constraints.num_of_columns());
    std::set<Point<T>> vertices;

	// select a random axis
    direction[0] = 1;

	// set the objective function and get the minimum 
	// and the maximum on the function
    std::vector<Point<T>> dir_vertices = find_min_max_points(constraints, direction, axis_vector);
    if (vertices.size()==0) {
        return Simplex<T>(std::move(directions), std::move(dir_vertices), true);
    }

	directions.push_back(direction);
	// if there exists only one vertex 
	if (dir_vertices.size()==1) {
		// the projection is singular
		return Simplex<T>(std::move(directions), std::move(dir_vertices), true);
	}

    vertices.insert(std::begin(dir_vertices), std::end(dir_vertices));

	// take the vector connecting the two vectices
	auto vector = dir_vertices[1]-dir_vertices[0];

	// select an orthogonal vector (any one is ok)
	// a normal of a new plan. Because of these 
	// choise for the new plan, either the
	// projection is singular or at least one of
	// the vertices that will be discovered has 
	// not been discovered yet
	directions.push_back(extend(get_an_orthogonal(vector), axis_vector, 
                                constraints.num_of_columns()));

	// set the objective function and get the
	// the minimum and the maximum on the plan
	dir_vertices = find_min_max_points(constraints, directions.back(), axis_vector);

	// if they are the same vertex
	if (dir_vertices.size()==1) {
		// the projection is singular
		return Simplex<T>(std::move(directions), std::move(dir_vertices), true);
	}

    vertices.insert(dir_vertices[0]);
    if (vertices.size()==2) {
        vertices.insert(dir_vertices[1]);
    }

	// select a vector orthogonal to both 
	// plan[0] and plan[1]. As in the previous
	// case, either the projection is singular
	// or at least one of the vertices that
	// will be discovered has not been
	// discovered yet
	directions.push_back(cross(directions[0], directions[1]));

	// set the objective function and get the
	// the minimum and the maximum on the plan
	dir_vertices = find_min_max_points(constraints, directions.back(), axis_vector);

	// if they are the same vertex
	if (dir_vertices.size()==1) {
		// the projection is singular
		return Simplex<T>(std::move(directions), std::move(dir_vertices), true);
	}

	// save the vertices on the boundaries
    vertices.insert(dir_vertices[0]);
    if (vertices.size()==3) {
        vertices.insert(dir_vertices[1]);
    }

	return Simplex<T>(std::move(directions), std::move(vertices), false);
}

template<typename T>
void
refine_3D_proj_on_singular(const LinearSystem<T> &constraints,
                           const std::vector<unsigned int> &axis_vector,
                           const std::vector<T> &plan,
                           std::vector<Point<T>> &vertices,
                           const Point<T> &v1, const Point<T> &v2)
{
    std::vector<T> direction = extend(Space3D::cross(plan, v1-v2), axis_vector, 
                                      constraints.num_of_columns());

    auto new_vertex = optimize(constraints, direction, axis_vector, GLP_MAX).optimizer;

	if ((v1 == new_vertex) || (v2 == new_vertex)) {
		return;
	}

	vertices.push_back(new_vertex);

	refine_3D_proj_on_singular(constraints, axis_vector, plan, vertices, v1, new_vertex);
	refine_3D_proj_on_singular(constraints, axis_vector, plan, vertices, new_vertex, v2);
}

template<typename T>
std::vector<Point<T>>
compute_3D_proj_vertices_on_singular(const LinearSystem<T> &constraints,
                                     const std::vector<unsigned int> &axis_vector,
                                     const std::vector<T> &plan)
{
std::cout << "compute_3D_proj_vertices_on_singular " << plan << std::flush;
    
	auto direction = get_an_orthogonal(plan);

    std::cout << "QUA1 " << std::endl << std::flush;
	// set the objective function and get the
	// the minimum and the maximum on the plan
	std::vector<Point<T>> vertices = find_min_max_points(constraints, direction, axis_vector);

	if (vertices.size()==1) {
		return find_min_max_points(constraints, Space3D::cross(plan, direction), axis_vector);
	}

    std::cout << "QUA " << vertices << std::endl << std::flush;

	refine_3D_proj_on_singular(constraints, axis_vector, plan, vertices, vertices[0], vertices[1]);
	refine_3D_proj_on_singular(constraints, axis_vector, plan, vertices, vertices[1], vertices[0]);

	return vertices;
}


template<typename T>
void
refine_3D_proj_on(LinearSystem<T> &constraints,
                    const std::vector<unsigned int> &axis_vector,
                    std::vector<Point<T>> &vertices,
                    Point<T> v1, const Point<T> &v2, const Point<T> &v3)
{
    using namespace Space3D;

	Plan<T> plan = Plan<T>(v1, v2, v3);

	// add the new plan to the constrains
	constraints.push_back(-plan.get_coeffs(), -plan.get_const());

    auto new_vertex = optimize(constraints, plan.get_coeffs(), axis_vector, GLP_MAX).optimizer;

	// if new_vertex is above the plan
	if (new_vertex * plan.get_coeffs() > plan.get_const()) { 
		vertices.push_back(new_vertex);

		refine_3D_proj_on(constraints, axis_vector, vertices, v1, v2, new_vertex);
		refine_3D_proj_on(constraints, axis_vector, vertices, v2, v3, new_vertex);
		refine_3D_proj_on(constraints, axis_vector, vertices, v3, v1, new_vertex);
	}

	// remove the added plan from the constraints
	constraints.pop_back();
}

template<typename T>
std::vector<Point<T>> 
compute_3D_proj_vertices(LinearSystem<T> constraints,
                         const std::vector<unsigned int> &axis_vector)
{
    using namespace Space3D;

	Simplex<T> simplex = get_initial_3D_simplex(constraints, axis_vector);

    std::cout << "QUI " << simplex.is_singular() << std::endl << std::flush;

	if (simplex.is_singular()) {
        std::cout << "BOH " << simplex.is_singular() << std::endl << std::flush;

		return compute_3D_proj_vertices_on_singular(constraints, axis_vector, 
                                                    simplex.get_last_direction());
	}

	std::vector<Point<T>> simplex_v(simplex.get_vertices());

	Plan<T> plan(simplex_v[0], simplex_v[1], simplex_v[2]);

	// if the fourth vertex is above this plan, then
	// the three vertices clockwise sorted and must be 
	// resorted in counter clockwise order. 
	if (plan.get_coeffs() * simplex_v[3] > plan.get_const()) {
        std::swap(simplex_v[1], simplex_v[2]);
	}

	std::vector<Point<T>> vertices(simplex_v);

	// add new vertices by using the plans of the simplex faces
    refine_3D_proj_on(constraints, axis_vector, vertices,
                      simplex_v[0], simplex_v[1], simplex_v[2]);

    refine_3D_proj_on(constraints, axis_vector, vertices,
					  simplex_v[1], simplex_v[0], simplex_v[3]);

    refine_3D_proj_on(constraints, axis_vector, vertices,
					  simplex_v[2], simplex_v[1], simplex_v[3]);

    refine_3D_proj_on(constraints, axis_vector, vertices,
					  simplex_v[0], simplex_v[2], simplex_v[3]);

    // remove duplicates
    std::set<Point<T>> s_vertices(std::begin(vertices), std::end(vertices));

	return std::vector<Point<T>>(std::begin(s_vertices), std::end(s_vertices));
}


namespace Space2D
{

template<typename T>
class Line 
{
    std::vector<T> _coeffs;
    T _const;

public:
    Line(const T& coeff1, const T& coeff2, const T& constant):
        _coeffs{coeff1, coeff2}, _const(constant)
    {}

    Line(const Point<T> &p1, const Point<T> &p2):
        _coeffs{p1[1]-p2[1], p2[0]-p1[0]}, _const(p2[0]*p1[1] - p2[1]*p1[0])
    {
    }

    const std::vector<T> &get_coeffs() const
    {
        return _coeffs;
    }
};
}

template<typename T>
void refine_2D_proj_on(const LinearSystem<T> &constraints,
                      const std::vector<unsigned int> &axis_vector, 
                      std::vector<Point<T>> &vertices,
                      Point<T> v1, const Point<T> v2)
{
    using namespace Space2D;

    while (true) {
        std::vector<T> direction = extend(Line<T>(v1, v2).get_coeffs(), axis_vector, 
                                          constraints.num_of_columns());

        OptimizationResult res = optimize(constraints, direction, axis_vector, GLP_MAX);

        if (res.status!=GLP_OPT) {
            return;
        }

        if (v1 == res.optimizer || v2 == res.optimizer) {
            return;
        }

        vertices.push_back(res.optimizer);
        refine_2D_proj_on(constraints, axis_vector, vertices, v1, res.optimizer);

        v1 = res.optimizer;
    }
}

template<typename T>
std::vector<Point<T>> compute_2D_proj_vertices(LinearSystem<T> constraints,
                                               const std::vector<unsigned int> &axis_vector)
{
    using namespace Space2D;

    std::vector<T> dir_vector(constraints.num_of_columns(), 0);
    dir_vector[axis_vector[0]] = 1;

	std::vector<Point<T>> vertices = find_min_max_points(constraints, dir_vector, axis_vector);

    if (vertices.size()==0) {
        return vertices;
    }

    if (vertices.size() == 1) {
        dir_vector[axis_vector[0]] = 0;
        dir_vector[axis_vector[1]] = 1;

        return find_min_max_points(constraints, dir_vector, axis_vector);
	}

	refine_2D_proj_on(constraints, axis_vector, vertices, vertices[0], vertices[1]);
	refine_2D_proj_on(constraints, axis_vector, vertices, vertices[1], vertices[0]);

	return vertices;
}

template<typename T>
std::vector<Point<T>> compute_1D_proj_vertices(LinearSystem<T> constraints,
                                               const std::vector<unsigned int> &axis_vector)
{
    std::vector<T> dir_vector(constraints.num_of_columns(), 0);
    dir_vector[axis_vector[0]] = 1;

    return find_min_max_points(constraints, dir_vector, axis_vector);
}

template<typename T>
json
compute_polytopes_union_proj(const json &json_input,
                             const std::vector<unsigned int> &axis_vector)
{
    json output;

    std::vector<Point<T>> (*compute_proj_vertices)(LinearSystem<T>, 
                                                   const std::vector<unsigned int> &);

    switch (axis_vector.size()) {
        case 1:
            compute_proj_vertices = compute_1D_proj_vertices;
            break;
        case 2:
            compute_proj_vertices = compute_2D_proj_vertices;
            break;
        case 3:
            compute_proj_vertices = compute_3D_proj_vertices;
            break;
        default:
            throw std::domain_error("Unsupported projection dimension");
    }

    unsigned int i=0;
    for (auto us_it = std::begin(json_input); us_it != std::end(json_input); ++us_it) {
        LinearSystem<double> constraints(us_it.value()["A"], us_it.value()["b"]);

        output[i++] = compute_proj_vertices(constraints, axis_vector);
    }

    return output;
}


template<typename T>
json
compute_flowpipe_proj(const json &json_input,
                      const std::vector<unsigned int> &axis_vector)
{
    json output;

    unsigned int i=0;
    for (auto fp_it = std::begin(json_input); fp_it != std::end(json_input); ++fp_it) {
        output[i++] = compute_polytopes_union_proj<T>(fp_it.value(), axis_vector);
    }

    return output;
}

template<typename T>
json
compute_input_proj(const json &json_input,
                    const std::vector<unsigned int> &axis_vector,
                    bool flowpipe)
{
    json output;

    if (flowpipe) {
        auto fp_it = json_input.find("flowpipe");
        if (fp_it != std::end(json_input)) {
            output["flowpipe"] = compute_flowpipe_proj<T>(fp_it.value(), axis_vector);
        }
    } else {
        auto ps_it = json_input.find("parameter set");
        if (ps_it != std::end(json_input)) {
            output["parameter set"] = compute_polytopes_union_proj<T>(ps_it.value(), axis_vector);
        }
    }
    return output;
}


int main()
{
    json json_input;
    std::cin >> json_input; 
    
    json output;
    bool flowpipe = json_input["what"]=="flowpipe";

    unsigned int i=0;
    for (auto data_it = std::begin(json_input["data"]); 
         data_it != std::end(json_input["data"]); ++data_it) {

        output[i++] = compute_input_proj<double>(data_it.value(), json_input["axes"],
                                                 flowpipe);
    }

    std::cout << output << std::endl;

    return 0;
}
