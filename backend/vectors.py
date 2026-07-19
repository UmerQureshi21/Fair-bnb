import numpy as np


def compute_vector_plot(user_embedding: list[float], top_match_embeddings: list[list[float]]) -> dict:
    """3D projection of [user, *top 3 hotels] such that angle-from-origin between
    any two projected points approximates their cosine similarity.

    Vectors are L2-normalized before the SVD - cosine similarity is scale
    invariant, but an SVD over un-normalized vectors optimizes to preserve raw
    dot products (|a||b|cos theta), which over-weights whichever vector has the
    largest magnitude. Normalizing first weights all 4 vectors equally so the
    chosen 3D subspace is optimized for cosine similarity specifically.

    Uncentered (no mean subtraction) is intentional: centering would move
    vectors off the origin and break the angle-from-origin correspondence.
    """
    vectors = np.array([user_embedding, *top_match_embeddings], dtype=float)
    norms = np.linalg.norm(vectors, axis=1, keepdims=True)
    norms[norms == 0] = 1.0  # guard a theoretical all-zero embedding
    unit = vectors / norms

    _, s, vt = np.linalg.svd(unit, full_matrices=False)
    coords = (unit @ vt[:3].T).tolist()

    # Fraction of the 4-vector Gram matrix's energy captured in 3D (1.0 = exact).
    fidelity = float(1 - (s[3] ** 2) / (s ** 2).sum()) if len(s) > 3 else 1.0

    return {"user": coords[0], "top_matches": coords[1:], "fidelity": fidelity}
