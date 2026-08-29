<?php
/**
 * Plugin Name: CueForge Plans
 * Description: Bloc dynamique affichant les forfaits publics de CueForge.
 * Version: 1.3.0
 * Author: CueForge
 */

if (!defined('ABSPATH')) {
    exit;
}

const CUEFORGE_PLANS_API_URL = 'https://app.cueforge.fr/api/public/plans';
const CUEFORGE_PLANS_CACHE_KEY = 'cueforge_plans_api_response';
const CUEFORGE_PLANS_LAST_GOOD_KEY = 'cueforge_plans_last_good_response';

function cueforge_plans_api_data(): array
{
    $cached = get_transient(CUEFORGE_PLANS_CACHE_KEY);
    if (is_array($cached)) {
        return $cached;
    }

    $endpoint = apply_filters('cueforge_plans_api_url', CUEFORGE_PLANS_API_URL);
    $response = wp_remote_get($endpoint, [
        'timeout' => 5,
        'headers' => ['Accept' => 'application/json'],
        'user-agent' => 'CueForge-WordPress/' . get_bloginfo('version'),
    ]);

    if (!is_wp_error($response) && wp_remote_retrieve_response_code($response) === 200) {
        $decoded = json_decode(wp_remote_retrieve_body($response), true);
        if (is_array($decoded) && isset($decoded['plans']) && is_array($decoded['plans'])) {
            set_transient(CUEFORGE_PLANS_CACHE_KEY, $decoded, 5 * MINUTE_IN_SECONDS);
            update_option(CUEFORGE_PLANS_LAST_GOOD_KEY, $decoded, false);
            return $decoded;
        }
    }

    $last_good = get_option(CUEFORGE_PLANS_LAST_GOOD_KEY, []);
    return is_array($last_good) ? $last_good : [];
}

function cueforge_plans_price(?int $cents): ?string
{
    if ($cents === null) {
        return null;
    }
    if ($cents === 0) {
        return 'Gratuit';
    }
    return number_format($cents / 100, 2, ',', ' ') . ' €';
}

function cueforge_plans_storage(int $bytes): string
{
    $gigabytes = $bytes / (1024 ** 3);
    $decimals = abs($gigabytes - round($gigabytes)) < 0.001 ? 0 : 1;
    return number_format($gigabytes, $decimals, ',', ' ') . ' Go';
}

function cueforge_plans_render_block(): string
{
    $data = cueforge_plans_api_data();
    $plans = isset($data['plans']) && is_array($data['plans']) ? $data['plans'] : [];
    $signup_url = isset($data['signupUrl']) ? (string) $data['signupUrl'] : 'https://app.cueforge.fr/?register=1';

    if ($plans === []) {
        return '<div ' . get_block_wrapper_attributes(['class' => 'cueforge-plans-block']) . '><p class="pricing-note">Les offres seront affichées prochainement.</p></div>';
    }

    ob_start();
    ?>
    <div <?php echo get_block_wrapper_attributes(['class' => 'cueforge-plans-block']); ?>>
        <div class="pricing-grid <?php echo count($plans) === 1 ? 'is-single' : ''; ?>">
            <?php foreach ($plans as $plan) :
                $monthly = cueforge_plans_price(array_key_exists('monthlyPriceCents', $plan) && $plan['monthlyPriceCents'] !== null ? (int) $plan['monthlyPriceCents'] : null);
                $annual = cueforge_plans_price(array_key_exists('annualPriceCents', $plan) && $plan['annualPriceCents'] !== null ? (int) $plan['annualPriceCents'] : null);
                $trial_days = isset($plan['trialDays']) ? (int) $plan['trialDays'] : 0;
                $featured = !empty($plan['featured']);
                $free = !empty($plan['free']);
                $bridge_included = !empty($plan['bridgeIncluded']);
                $plan_url = add_query_arg('plan', sanitize_key((string) ($plan['code'] ?? '')), $signup_url);
                ?>
                <article class="pricing-card <?php echo $featured ? 'featured' : ''; ?>" data-reveal>
                    <?php if ($featured) : ?><div class="plan-top"><span>Mis en avant</span></div><?php endif; ?>
                    <h3><?php echo esc_html((string) ($plan['name'] ?? 'CueForge')); ?></h3>
                    <div class="plan-storage">
                        <strong><?php echo esc_html(cueforge_plans_storage((int) ($plan['storageQuotaBytes'] ?? 0))); ?></strong>
                        <span>de stockage audio</span>
                    </div>
                    <div class="price">
                        <?php if ($free) : ?>
                            <strong>Gratuit</strong>
                        <?php elseif ($monthly !== null) : ?>
                            <strong><?php echo esc_html($monthly); ?><small>/mois</small></strong>
                            <?php if ($annual !== null) : ?><span>ou <?php echo esc_html($annual); ?> par an</span><?php endif; ?>
                        <?php elseif ($annual !== null) : ?>
                            <strong><?php echo esc_html($annual); ?><small>/an</small></strong>
                        <?php elseif ($trial_days > 0) : ?>
                            <strong>Essai <?php echo esc_html((string) $trial_days); ?> jours</strong>
                            <span>puis abonnement mensuel ou annuel</span>
                        <?php else : ?>
                            <strong>Tarif à venir</strong>
                        <?php endif; ?>
                    </div>
                    <p class="plan-copy"><?php echo esc_html((string) ($plan['description'] ?? '')); ?></p>
                    <a class="button button-primary wide" href="<?php echo esc_url($plan_url); ?>"><?php echo $free ? 'Démarrer maintenant' : 'Choisir ce forfait'; ?> <span aria-hidden="true">↗</span></a>
                    <ul>
                        <?php if ($trial_days > 0) : ?><li><i>✓</i> Essai de <?php echo esc_html((string) $trial_days); ?> jours</li><?php endif; ?>
                        <li><i>✓</i> Toutes les fonctions de régie</li>
                        <li><i>✓</i> PWA et mode hors ligne</li>
                        <?php if ($bridge_included) : ?>
                            <li><i>✓</i> CueForge Bridge pour macOS et Windows</li>
                        <?php else : ?>
                            <li><i>—</i> CueForge Bridge non inclus</li>
                        <?php endif; ?>
                    </ul>
                </article>
            <?php endforeach; ?>
        </div>
    </div>
    <?php
    return (string) ob_get_clean();
}

function cueforge_plans_register_block(): void
{
    $asset = require __DIR__ . '/editor.asset.php';
    wp_register_script(
        'cueforge-plans-editor',
        plugins_url('editor.js', __FILE__),
        $asset['dependencies'],
        $asset['version'],
        true
    );
    wp_register_style(
        'cueforge-plans',
        plugins_url('style.css', __FILE__),
        [],
        '1.3.0'
    );
    register_block_type('cueforge/plans', [
        'api_version' => 2,
        'title' => 'Forfaits CueForge',
        'category' => 'widgets',
        'icon' => 'tickets-alt',
        'description' => 'Affiche les forfaits publics configurés dans CueForge.',
        'editor_script' => 'cueforge-plans-editor',
        'style' => 'cueforge-plans',
        'render_callback' => 'cueforge_plans_render_block',
    ]);
}
add_action('init', 'cueforge_plans_register_block');
