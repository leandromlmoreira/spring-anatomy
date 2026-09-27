package dev.leandromacedo.patterns.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.client.RestClientException;

import dev.leandromacedo.patterns.adapter.CanalIndisponivelException;
import dev.leandromacedo.patterns.service.CepNaoEncontradoException;
import dev.leandromacedo.patterns.service.RecursoNaoEncontradoException;

@RestControllerAdvice
public class TratadorDeErros {

    @ExceptionHandler(RecursoNaoEncontradoException.class)
    ProblemDetail naoEncontrado(RecursoNaoEncontradoException erro) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, erro.getMessage());
    }

    @ExceptionHandler({ CepNaoEncontradoException.class, CanalIndisponivelException.class })
    ProblemDetail naoProcessavel(RuntimeException erro) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.UNPROCESSABLE_ENTITY, erro.getMessage());
    }

    @ExceptionHandler({ IllegalArgumentException.class, IllegalStateException.class })
    ProblemDetail requisicaoInvalida(RuntimeException erro) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, erro.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ProblemDetail camposInvalidos(MethodArgumentNotValidException erro) {
        String detalhe = erro.getBindingResult().getFieldErrors().stream()
                .map(campo -> campo.getDefaultMessage())
                .findFirst()
                .orElse("Requisição inválida.");
        return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, detalhe);
    }

    @ExceptionHandler(RestClientException.class)
    ProblemDetail viaCepIndisponivel(RestClientException erro) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.SERVICE_UNAVAILABLE,
                "ViaCEP indisponível agora. Tente de novo ou use a estratégia offline.");
    }
}
