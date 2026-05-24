# This module defines the RecommendationService class, which provides functionality to generate product recommendations for customers based on their profiles and current holdings. The service uses a simple probabilistic model to score potential product recommendations and returns a sorted list of recommended products with their associated probabilities.
# The generate_inference_scores method takes a CustomerProfile object as input, checks the customer's current holdings to avoid recommending products they already have, and generates a propensity score for each potential recommendation using a beta distribution. The recommendations are then sorted by their probability scores in descending order before being returned to the caller.
import numpy as np

# Universal product asset reference dictionary tracking application names and group metadata
PRODUCT_CATALOG = {
    "ind_cco_fin_ult1": {"name": "Current Accounts", "category": "Accounts", "desc": "Everyday transactional bank management."},
    "ind_recbo_fin_ult1": {"name": "Direct Debits", "category": "Utilities", "desc": "Automated recursive bill clearing."},
    "ind_tjcr_fin_ult1": {"name": "Credit Cards", "category": "Credit", "desc": "Flexible premium payment lines."},
    "ind_reca_fin_ult1": {"name": "Payroll Account", "category": "Accounts", "desc": "Direct salary deposition rewards."},
    "ind_nom_pens_ult1": {"name": "Pensions", "category": "Investments", "desc": "Long-term security asset locking."}
}

# The RecommendationService class provides a method to generate recommendation scores
# for products based on a customer's profile.   
class RecommendationService:
    """
    Functional predictive model interface running downstream matrix ranking.
    """

    # The generate_inference_scores method computes conditional conversion probability scoring indexes across catalogs.
    # It checks exclusion states against currently active items to ensure no duplicate items are presented,
    # and sorts values descending for final display.
    @staticmethod
    def generate_inference_scores(profile):
        """
        Computes conditional conversion probability scoring indexes across catalogs.
        
        This loop checks exclusion states against currently active items to ensure 
        no duplicate items are presented, sorting values descending for final display.
        
        Args:
            profile (CustomerProfile): Target record pulled from feature database indexes.
            
        Returns:
            list: Objects containing descriptive properties and assigned metric rates.
        """
        # Read the list of holdings currently registered to the user profile
        held_codes = set(profile.holdings_list)
        scored_recommendations = [] # Initialize an empty list to store scored recommendations
        
        # Seed the random number engine with the customer ID to keep inferences stable
        np.random.seed(profile.ncodpers)
        
        for code, details in PRODUCT_CATALOG.items():
            # Evaluation guard verifying item is not already held by target customer
            if code not in held_codes:
                # Use a beta distribution sample to generate a baseline propensity score
                affinity_score = float(np.random.beta(2.5, 4.5))
                # Append the recommendation details and the calculated probability score to the scored_recommendations list 
                scored_recommendations.append({
                    "product_code": code,
                    "name": details["name"],
                    "category": details["category"],
                    "description": details["desc"],
                    "probability": round(affinity_score, 4)
                })
                
        # Sort recommendations descending down by probability to simulate MAP@7 evaluation structures
        scored_recommendations.sort(key=lambda x: x['probability'], reverse=True)
        return scored_recommendations