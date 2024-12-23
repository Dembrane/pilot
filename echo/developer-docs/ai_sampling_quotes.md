# Hybrid Sampling Strategy with Dynamic Clustering and Democratic Context Filling

## Introduction

This document outlines an enhanced hybrid sampling strategy for conversation analysis that combines **democratic representation**, **dynamic cluster-based sampling**, and **democratic context filling** to achieve a balanced, representative, and thematically diverse sample while efficiently utilizing the context window.

## Objectives

-   **Fair Representation**: Ensure every conversation is represented in the sample.
-   **Thematic Diversity**: Capture a wide range of themes and topics discussed.
-   **Frequency Bias Reduction**: Prevent the same kind of quotes (themes) from disproportionately influencing the sample.
-   **Efficient Context Utilization**: Maximize the use of the context window without exceeding token limits.
-   **Dynamic Cluster Determination**: Adapt to the natural clustering of the data without pre-specifying the number of clusters.
-   **Enhanced Democratic Context Filling**: Further enhance representativeness by democratically filling the remaining context after cluster-based selection.

## Sampling Strategy

### Hybrid Approach: Democratic + Dynamic Cluster-Based + Democratic Filling

#### Rationale

This approach combines:

1. **Democratic Sampling**: Ensures every conversation contributes to the sample.
2. **Dynamic Cluster-Based Sampling**: Uses DBSCAN to identify clusters based on the density of quote embeddings, ensuring representation of all major themes.
3. **Democratic Context Filling**: After cluster-based selection, fills the remaining context by selecting additional quotes from conversations that have not yet contributed a second quote, further enhancing democratic representation.

#### Methodology

1. **Democratic Sampling (First Pass)**:
    
    -   Select one random quote from each conversation.
    -   Ensures all conversations are represented.
2. **Dynamic Cluster-Based Sampling (Second Pass)**:
    
    -   Perform DBSCAN clustering on quote embeddings to group them into thematic clusters.
    -   Select one random quote from each identified cluster (excluding the noise cluster, -1).
    -   Ensures representation of all major themes.
3. **Cluster-Based Context Filling (Third Pass)**:
    
    -   If space remains in the context window, continue selecting quotes from clusters.
    -   Prioritize smaller clusters to ensure representation of less frequent themes.
    -   Shuffle quotes within clusters to maintain randomness.
    -   Select only quotes not already chosen.
4. **Democratic Context Filling (Fourth Pass)**:
    
    -   If space still remains, select one additional quote from each conversation that hasn't contributed a second quote.
    -   Shuffle the list of such conversations.
    -   Select only quotes not already chosen.

#### Mathematical Explanation

1. **DBSCAN Clustering**:
    
    -   Groups data points based on density. Core points are those with at least `min_samples` points within a radius `eps`.
    -   Clusters are formed around core points and their reachable neighbors.
    -   Noise points are labeled as -1.
    -   The number of clusters is determined dynamically.
2. **Token Limit Consideration**:
    
    -   Ensure the total tokens \( T_{\text{current}} \) do not exceed the context limit \( T_{\text{limit}} \):
        
        \[
        T_{\text{current}} = \sum_{i=1}^{N} t_i + \sum_{j=1}^{k} t_j + \sum_{l=1}^{M} t_l + \sum_{m=1}^{P} t_m \leq T_{\text{limit}}
        \]
        
        where:
        
        -   \( t_i \) is the token count of the quote from conversation \( i \) in the first pass.
        -   \( t_j \) is the token count of the quote from cluster \( j \) in the second pass.
        -   \( t_l \) is the token count of additional quotes from clusters in the third pass.
        -   \( t_m \) is the token count of additional quotes from conversations in the fourth pass.
        -   \( N \) is the number of conversations.
        -   \( k \) is the number of clusters (dynamically determined).
        -   \( M \) is the number of additional quotes selected in the third pass.
        -   \( P \) is the number of additional quotes selected in the fourth pass.

### Steps in Implementation

1. **Fetch and Organize Quotes**:
    
    -   Retrieve all quotes for the analysis run.
    -   Organize quotes by conversation ID.
    -   Filter out quotes without embeddings.
2. **Perform DBSCAN Clustering**:
    
    -   Cluster the embeddings using DBSCAN with appropriate `eps` and `min_samples`.
    -   Organize quotes by cluster ID.
3. **Democratic Sampling (First Pass)**:
    
    -   For each conversation, select one random quote.
    -   Track the total token count.
4. **Cluster-Based Sampling (Second Pass)**:
    
    -   For each cluster (excluding noise cluster -1), select one random quote not already selected.
    -   Track the total token count.
5. **Cluster-Based Context Filling (Third Pass)**:
    
    -   If \( T_{\text{current}} < T_{\text{limit}} \), continue selecting quotes from clusters.
    -   Prioritize smaller clusters.
    -   Shuffle quotes within clusters.
    -   Select only quotes not already chosen.
    -   Track the total token count.
6. **Democratic Context Filling (Fourth Pass)**:
    
    -   If \( T_{\text{current}} < T_{\text{limit}} \), select one additional quote from each conversation that hasn't contributed a second quote.
    -   Shuffle the list of such conversations.
    -   Select only quotes not already chosen.
    -   Track the total token count.

## Potential Drawbacks

### 1. Increased Complexity

-   **Issue**: The addition of a fourth pass increases the complexity of the sampling logic.
-   **Mitigation**:
    -   Carefully document and test the implementation.
    -   Consider the trade-off between complexity and representativeness.

### 2. Potential for Thematic Redundancy

-   **Issue**: The fourth pass might select quotes thematically similar to those already chosen.
-   **Mitigation**:
    -   Consider incorporating a similarity check in the fourth pass, although this would increase computational cost.

### 3. Computational Cost

-   **Issue**: The additional pass adds to the overall computational cost.
-   **Mitigation**:
    -   Optimize the selection process within the fourth pass.
    -   Evaluate whether the added representativeness justifies the increased cost.

## Alternatives Considered

### 1. Weighted Sampling in the Fourth Pass

-   **Description**: Use a weighted approach considering conversation length and cluster representation.
-   **Reason Not Chosen**: The current approach provides a simpler and more direct way to enhance democratic representation.

### 2. Iterative Refinement

-   **Description**: After the fourth pass, iteratively replace similar quotes with those from underrepresented conversations or clusters.
-   **Reason Not Chosen**: Computationally more intensive and may not scale well with large datasets.

### 3. Hybrid Cluster-Conversation Selection

-   **Description**: In the third pass, alternate between selecting from clusters and conversations.
-   **Reason Not Chosen**: The current approach provides a clearer separation of concerns between cluster-based and conversation-based selection.

## Conclusion

The enhanced hybrid sampling strategy with dynamic clustering and democratic context filling offers a robust approach to quote selection in conversation analysis. It ensures fair representation of all conversations, captures thematic diversity, and efficiently utilizes the context window. The addition of a fourth pass further enhances democratic representation by allowing more conversations to contribute additional quotes. While there are potential drawbacks related to increased complexity and potential thematic redundancy, these can be mitigated through careful implementation and consideration of the specific goals of the analysis.

## References

1. **DBSCAN**:
    
    -   Ester, M., Kriegel, H. P., Sander, J., & Xu, X. (1996). *A density-based algorithm for discovering clusters in large spatial databases with noise*. In *Proceedings of the Second International Conference on Knowledge Discovery and Data Mining* (pp. 226-231).
2. **HDBSCAN**:
    
    -   Campello, R. J., Moulavi, D., & Sander, J. (2013). *Density-based clustering based on hierarchical density estimates*. In *Pacific-Asia Conference on Knowledge Discovery and Data Mining* (pp. 160-172). Springer, Berlin, Heidelberg.
3. **OPTICS**:
    
    -   Ankerst, M., Breunig, M. M., Kriegel, H. P., & Sander, J. (1999). *OPTICS: ordering points to identify the clustering structure*. *ACM Sigmod record*, *28*(2), 49-60.
4. **Agglomerative Clustering**:
    
    -   Murtagh, F., & Contreras, P. (2012). *Algorithms for hierarchical clustering: an overview*. *Wiley Interdisciplinary Reviews: Data Mining and Knowledge Discovery*, *2*(1), 86-97.
5. **Curse of Dimensionality**:
    
    -   Bellman, R. E. (1961). *Adaptive control processes: a guided tour*. Princeton University Press.