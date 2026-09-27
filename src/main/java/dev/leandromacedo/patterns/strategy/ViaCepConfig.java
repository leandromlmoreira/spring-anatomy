package dev.leandromacedo.patterns.strategy;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.support.RestClientAdapter;
import org.springframework.web.service.invoker.HttpServiceProxyFactory;

@Configuration
public class ViaCepConfig {

    @Bean
    ViaCepClient viaCepClient(RestClient.Builder builder,
            @Value("${anatomy.viacep.url:https://viacep.com.br/ws}") String url) {
        RestClient restClient = builder.baseUrl(url).build();
        return HttpServiceProxyFactory.builderFor(RestClientAdapter.create(restClient))
                .build()
                .createClient(ViaCepClient.class);
    }
}
